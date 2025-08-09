"use server";

import { db } from './db';
import { tryCatch } from "./try-catch";
import { executePluginHook } from './plugin-manager';
import type { PostStatus, PostType, CommentStatus, PostMetaType, CustomFieldType, BlockType } from '@prisma/client';
import type { ContentBlockWithChildren } from './types';
import { type } from 'arktype';

// Type definitions for blocks and meta
interface BlockInput {
  blockType: BlockType;
  customType?: string | null;
  order?: number;
  parentId?: number | null;
  content: any;
  attributes: any;
  pluginId?: string | null;
}

interface MetaInput {
  key: string;
  value: string;
  type?: PostMetaType;
}
import { 
  PostCreateSchema,
  PostUpdateSchema,
  CategoryCreateSchema,
  CategoryUpdateSchema,
  TagCreateSchema,
  TagUpdateSchema,
  CommentCreateSchema,
  CommentUpdateSchema,
  SettingUpdateSchema,
  BulkPostOperationSchema,
  BulkCommentOperationSchema,
  PostTypeCreateSchema,
  CustomFieldCreateSchema,
  PositiveIntegerSchema,
  PostStatusSchema,
  CommentStatusSchema,
  type PostCreate,
  type PostUpdate,
  type CategoryCreate,
  type CategoryUpdate,
  type TagCreate,
  type TagUpdate,
  type CommentCreate,
  type CommentUpdate,
  type SettingUpdate,
  type BulkPostOperation,
  type BulkCommentOperation,
  type PostTypeCreate,
  type CustomFieldCreate
} from './validation-schemas';
import { createValidatedAction } from './validation-utils';

// ====== POST MUTATIONS ======
export const createPost = createValidatedAction(
  PostCreateSchema,
  async (data: PostCreate) => {
    // Execute beforePostCreate hooks
    const hookResults = await executePluginHook('beforePostCreate', data);
    const modifiedData = hookResults.length > 0 ? (hookResults[hookResults.length - 1] as typeof data) : data;
    
    const { categoryIds, tagIds, meta, blocks, publishedAt, ...postData } = modifiedData;
    
    return tryCatch(db.$transaction(async (tx) => {
      // Create the post
      const post = await tx.post.create({
        data: {
          ...postData,
          publishedAt: publishedAt ? new Date(publishedAt) : undefined
        }
      });

      // Add blocks if provided
      if (blocks && blocks.length > 0) {
        await tx.contentBlock.createMany({
          data: blocks.map((block: unknown, index) => {
            const blockInput = block as BlockInput;
            return {
              postId: post.id,
              blockType: blockInput.blockType,
              customType: blockInput.customType,
              order: blockInput.order || index,
              parentId: blockInput.parentId,
              content: blockInput.content as any,
              attributes: blockInput.attributes as any,
              pluginId: blockInput.pluginId,
            };
          })
        });
      }

      // Add categories
      if (categoryIds && categoryIds.length > 0) {
        await tx.postCategory.createMany({
          data: categoryIds.map((categoryId: number) => ({
            postId: post.id,
            categoryId
          }))
        });
      }

      // Add tags
      if (tagIds && tagIds.length > 0) {
        await tx.postTag.createMany({
          data: tagIds.map((tagId: number) => ({
            postId: post.id,
            tagId
          }))
        });
      }

      // Add meta fields
      if (meta && meta.length > 0) {
        await tx.postMeta.createMany({
          data: meta.map((metaItem: unknown) => {
            const metaInput = metaItem as MetaInput;
            return {
              postId: post.id,
              metaKey: metaInput.key,
              metaValue: metaInput.value,
              metaType: metaInput.type || 'STRING'
            };
          })
        });
      }

      // Get the complete post with relations
      const completePost = await tx.post.findUnique({
        where: { id: post.id },
        include: {
          author: true,
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
          postMeta: true,
          blocks: {
            orderBy: { order: 'asc' },
            include: {
              children: {
                orderBy: { order: 'asc' }
              }
            }
          }
        }
      });

      // Execute afterPostCreate hooks
      await executePluginHook('afterPostCreate', completePost);
      
      return completePost;
    }));
  }
);

export const updatePost = createValidatedAction(
  PostUpdateSchema,
  async (data: PostUpdate) => {
    const { id, categoryIds, tagIds, meta, blocks, publishedAt, ...postData } = data;
    
    return tryCatch(db.$transaction(async (tx) => {
      // Update the post
      const post = await tx.post.update({
        where: { id },
        data: {
          ...postData,
          publishedAt: publishedAt ? new Date(publishedAt) : undefined
        }
      });

      // Update blocks if provided
      if (blocks !== undefined) {
        // Delete existing blocks
        await tx.contentBlock.deleteMany({
          where: { postId: id }
        });

        // Create new blocks
        if (blocks.length > 0) {
          await tx.contentBlock.createMany({
            data: blocks.map((block: unknown, index) => {
              const blockInput = block as BlockInput;
              return {
                postId: id,
                blockType: blockInput.blockType,
                customType: blockInput.customType,
                order: blockInput.order || index,
                parentId: blockInput.parentId,
                content: blockInput.content as any,
                attributes: blockInput.attributes as any,
                pluginId: blockInput.pluginId,
              };
            })
          });
        }
      }

      // Update categories if provided
      if (categoryIds !== undefined) {
        await tx.postCategory.deleteMany({
          where: { postId: id }
        });
        
        if (categoryIds.length > 0) {
          await tx.postCategory.createMany({
            data: categoryIds.map(categoryId => ({
              postId: id,
              categoryId
            }))
          });
        }
      }

      // Update tags if provided
      if (tagIds !== undefined) {
        await tx.postTag.deleteMany({
          where: { postId: id }
        });
        
        if (tagIds.length > 0) {
          await tx.postTag.createMany({
            data: tagIds.map(tagId => ({
              postId: id,
              tagId
            }))
          });
        }
      }

      // Update meta if provided
      if (meta !== undefined) {
        await tx.postMeta.deleteMany({
          where: { postId: id }
        });
        
        if (meta.length > 0) {
          await tx.postMeta.createMany({
            data: meta.map((m: unknown) => {
              const metaInput = m as MetaInput;
              return {
                postId: id,
                metaKey: metaInput.key,
                metaValue: metaInput.value,
                metaType: metaInput.type || 'STRING'
              };
            })
          });
        }
      }

      return post;
    }));
  }
);

export const deletePost = createValidatedAction(
  PositiveIntegerSchema,
  async (id: number) => {
    return tryCatch(db.post.delete({
      where: { id }
    }));
  }
);

export const publishPost = createValidatedAction(
  PositiveIntegerSchema,
  async (id: number) => {
    return tryCatch(db.post.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date()
      }
    }));
  }
);

export const unpublishPost = createValidatedAction(
  PositiveIntegerSchema,
  async (id: number) => {
    return tryCatch(db.post.update({
      where: { id },
      data: {
        status: 'DRAFT',
        publishedAt: null
      }
    }));
  }
);

// ====== CATEGORY MUTATIONS ======
export const createCategory = createValidatedAction(
  CategoryCreateSchema,
  async (data: CategoryCreate) => {
    return tryCatch(db.category.create({
      data
    }));
  }
);

export const updateCategory = createValidatedAction(
  CategoryUpdateSchema,
  async (data: CategoryUpdate) => {
    const { id, ...updateData } = data;
    return tryCatch(db.category.update({
      where: { id },
      data: updateData
    }));
  }
);

export const deleteCategory = createValidatedAction(
  PositiveIntegerSchema,
  async (id: number) => {
    return tryCatch(db.category.delete({
      where: { id }
    }));
  }
);

// ====== TAG MUTATIONS ======
export const createTag = createValidatedAction(
  TagCreateSchema,
  async (data: TagCreate) => {
    return tryCatch(db.tag.create({
      data
    }));
  }
);

export const updateTag = createValidatedAction(
  TagUpdateSchema,
  async (data: TagUpdate) => {
    const { id, ...updateData } = data;
    return tryCatch(db.tag.update({
      where: { id },
      data: updateData
    }));
  }
);

export const deleteTag = createValidatedAction(
  PositiveIntegerSchema,
  async (id: number) => {
    return tryCatch(db.tag.delete({
      where: { id }
    }));
  }
);

// ====== COMMENT MUTATIONS ======
export const createComment = createValidatedAction(
  CommentCreateSchema,
  async (data: CommentCreate) => {
    return tryCatch(db.comment.create({
      data: {
        ...data,
        status: 'PENDING' // Comments start as pending
      }
    }));
  }
);

export const updateComment = createValidatedAction(
  CommentUpdateSchema,
  async (data: CommentUpdate) => {
    const { id, ...updateData } = data;
    return tryCatch(db.comment.update({
      where: { id },
      data: updateData
    }));
  }
);

export const approveComment = createValidatedAction(
  PositiveIntegerSchema,
  async (id: number) => {
    return tryCatch(db.comment.update({
      where: { id },
      data: { status: 'APPROVED' }
    }));
  }
);

export const rejectComment = createValidatedAction(
  PositiveIntegerSchema,
  async (id: number) => {
    return tryCatch(db.comment.update({
      where: { id },
      data: { status: 'SPAM' }
    }));
  }
);

export const deleteComment = createValidatedAction(
  PositiveIntegerSchema,
  async (id: number) => {
    return tryCatch(db.comment.delete({
      where: { id }
    }));
  }
);

// ====== SETTINGS MUTATIONS ======
export const setSetting = createValidatedAction(
  SettingUpdateSchema,
  async (data: SettingUpdate) => {
    const { key, value, type = 'STRING', description } = data;
    return tryCatch(db.setting.upsert({
      where: { key },
      update: { value, type, description },
      create: { key, value, type, description }
    }));
  }
);

export const deleteSetting = createValidatedAction(
  type("string").pipe((s, problems) => {
    if (!s.trim()) return problems.mustBe("a non-empty string");
    return s;
  }),
  async (key: string) => {
    return tryCatch(db.setting.delete({
      where: { key }
    }));
  }
);

// ====== BULK OPERATIONS ======
export const bulkUpdatePostStatus = createValidatedAction(
  BulkPostOperationSchema,
  async (data: BulkPostOperation) => {
    const { postIds, status } = data;
    if (!status) throw new Error('Status is required for bulk status update');
    
    return tryCatch(db.post.updateMany({
      where: {
        id: {
          in: postIds
        }
      },
      data: { status }
    }));
  }
);

export const bulkDeletePosts = createValidatedAction(
  type("number[]").pipe((ids, problems) => {
    if (ids.length === 0) return problems.mustBe("a non-empty array");
    return ids;
  }),
  async (postIds: number[]) => {
    return tryCatch(db.post.deleteMany({
      where: {
        id: {
          in: postIds
        }
      }
    }));
  }
);

export const bulkUpdateCommentStatus = createValidatedAction(
  BulkCommentOperationSchema,
  async (data: BulkCommentOperation) => {
    const { commentIds, status } = data;
    if (!status) throw new Error('Status is required for bulk status update');
    
    return tryCatch(db.comment.updateMany({
      where: {
        id: {
          in: commentIds
        }
      },
      data: { status }
    }));
  }
);

export const bulkDeleteComments = createValidatedAction(
  type("number[]").pipe((ids, problems) => {
    if (ids.length === 0) return problems.mustBe("a non-empty array");
    return ids;
  }),
  async (commentIds: number[]) => {
    return tryCatch(db.comment.deleteMany({
      where: {
        id: {
          in: commentIds
        }
      }
    }));
  }
);

// ====== CUSTOM POST TYPES ======
export const createPostType = createValidatedAction(
  PostTypeCreateSchema,
  async (data: PostTypeCreate) => {
    return tryCatch(db.postTypeDefinition.create({
      data
    }));
  }
);

export const createCustomField = createValidatedAction(
  CustomFieldCreateSchema,
  async (data: CustomFieldCreate) => {
    return tryCatch(db.customField.create({
      data
    }));
  }
);

// ====== UTILITY FUNCTIONS ======
export const generateUniqueSlug = createValidatedAction(
  type({
    title: "string",
    postId: "number?"
  }).pipe((input, problems) => {
    if (!input.title.trim()) {
      return problems.mustBe("title cannot be empty");
    }
    return input;
  }),
  async ({ title, postId }: { title: string; postId?: number }) => {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await db.post.findFirst({
        where: {
          slug,
          id: postId ? { not: postId } : undefined
        }
      });

      if (!existing) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
);

export const generateUniqueCategorySlug = createValidatedAction(
  type({
    name: "string", 
    categoryId: "number?"
  }).pipe((input, problems) => {
    if (!input.name.trim()) {
      return problems.mustBe("name cannot be empty");
    }
    return input;
  }),
  async ({ name, categoryId }: { name: string; categoryId?: number }) => {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await db.category.findFirst({
        where: {
          slug,
          id: categoryId ? { not: categoryId } : undefined
        }
      });

      if (!existing) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
);

export const generateUniqueTagSlug = createValidatedAction(
  type({
    name: "string",
    tagId: "number?"
  }).pipe((input, problems) => {
    if (!input.name.trim()) {
      return problems.mustBe("name cannot be empty");
    }
    return input;
  }),
  async ({ name, tagId }: { name: string; tagId?: number }) => {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await db.tag.findFirst({
        where: {
          slug,
          id: tagId ? { not: tagId } : undefined
        }
      });

      if (!existing) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
);
