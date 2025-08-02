"use server";

import { db } from './db';
import { tryCatch } from "./try-catch";
import { executePluginHook } from './plugin-manager';
import type { PostStatus, PostType, CommentStatus, PostMetaType, CustomFieldType } from '@prisma/client';

// ====== POST MUTATIONS ======
export async function createPost(data: {
    title: string;
    content?: string;
    excerpt?: string;
    slug: string;
    status?: PostStatus;
    type?: PostType;
    customType?: string;
    featuredImage?: string;
    authorId: number;
    parentId?: number;
    menuOrder?: number;
    commentStatus?: boolean;
    pingStatus?: boolean;
    publishedAt?: Date;
    categoryIds?: number[];
    tagIds?: number[];
    meta?: Array<{ key: string; value: string; type?: PostMetaType }>;
}) {
    // Execute beforePostCreate hooks
    const hookResults = await executePluginHook('beforePostCreate', data);
    const modifiedData = hookResults.length > 0 ? (hookResults[hookResults.length - 1] as typeof data) : data;
    
    const { categoryIds, tagIds, meta, ...postData } = modifiedData;
    
    return tryCatch(db.$transaction(async (tx) => {
        // Create the post
        const post = await tx.post.create({
            data: postData
        });

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
                data: meta.map((metaItem: { key: string; value: string; type?: PostMetaType }) => ({
                    postId: post.id,
                    metaKey: metaItem.key,
                    metaValue: metaItem.value,
                    metaType: metaItem.type || 'STRING'
                }))
            });
        }

        // Get the complete post with relations
        const completePost = await tx.post.findUnique({
            where: { id: post.id },
            include: {
                author: true,
                categories: { include: { category: true } },
                tags: { include: { tag: true } },
                postMeta: true
            }
        });

        // Execute afterPostCreate hooks
        await executePluginHook('afterPostCreate', completePost);
        
        return completePost;
    }));
}

export async function updatePost(id: number, data: {
    title?: string;
    content?: string;
    excerpt?: string;
    slug?: string;
    status?: PostStatus;
    type?: PostType;
    customType?: string;
    featuredImage?: string;
    parentId?: number;
    menuOrder?: number;
    commentStatus?: boolean;
    pingStatus?: boolean;
    publishedAt?: Date;
    categoryIds?: number[];
    tagIds?: number[];
    meta?: Array<{ key: string; value: string; type?: PostMetaType }>;
}) {
    const { categoryIds, tagIds, meta, ...postData } = data;
    
    return tryCatch(db.$transaction(async (tx) => {
        // Update the post
        const post = await tx.post.update({
            where: { id },
            data: postData
        });

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
                    data: meta.map(m => ({
                        postId: id,
                        metaKey: m.key,
                        metaValue: m.value,
                        metaType: m.type || 'STRING'
                    }))
                });
            }
        }

        return post;
    }));
}

export async function deletePost(id: number) {
    return tryCatch(db.post.delete({
        where: { id }
    }));
}

export async function publishPost(id: number) {
    return tryCatch(db.post.update({
        where: { id },
        data: {
            status: 'PUBLISHED',
            publishedAt: new Date()
        }
    }));
}

export async function unpublishPost(id: number) {
    return tryCatch(db.post.update({
        where: { id },
        data: {
            status: 'DRAFT',
            publishedAt: null
        }
    }));
}

// ====== CATEGORY MUTATIONS ======
export async function createCategory(data: {
    name: string;
    slug: string;
    description?: string;
    parentId?: number;
}) {
    return tryCatch(db.category.create({
        data
    }));
}

export async function updateCategory(id: number, data: {
    name?: string;
    slug?: string;
    description?: string;
    parentId?: number;
}) {
    return tryCatch(db.category.update({
        where: { id },
        data
    }));
}

export async function deleteCategory(id: number) {
    return tryCatch(db.category.delete({
        where: { id }
    }));
}

// ====== TAG MUTATIONS ======
export async function createTag(data: {
    name: string;
    slug: string;
    description?: string;
}) {
    return tryCatch(db.tag.create({
        data
    }));
}

export async function updateTag(id: number, data: {
    name?: string;
    slug?: string;
    description?: string;
}) {
    return tryCatch(db.tag.update({
        where: { id },
        data
    }));
}

export async function deleteTag(id: number) {
    return tryCatch(db.tag.delete({
        where: { id }
    }));
}

// ====== COMMENT MUTATIONS ======
export async function createComment(data: {
    postId: number;
    parentId?: number;
    authorId?: number;
    authorName: string;
    authorEmail: string;
    authorUrl?: string;
    content: string;
    authorIp?: string;
    agent?: string;
}) {
    return tryCatch(db.comment.create({
        data: {
            ...data,
            status: 'PENDING' // Comments start as pending
        }
    }));
}

export async function updateComment(id: number, data: {
    content?: string;
    status?: CommentStatus;
    authorName?: string;
    authorEmail?: string;
    authorUrl?: string;
}) {
    return tryCatch(db.comment.update({
        where: { id },
        data
    }));
}

export async function approveComment(id: number) {
    return tryCatch(db.comment.update({
        where: { id },
        data: { status: 'APPROVED' }
    }));
}

export async function rejectComment(id: number) {
    return tryCatch(db.comment.update({
        where: { id },
        data: { status: 'SPAM' }
    }));
}

export async function deleteComment(id: number) {
    return tryCatch(db.comment.delete({
        where: { id }
    }));
}

// ====== SETTINGS MUTATIONS ======
export async function setSetting(key: string, value: string, type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ARRAY' = 'STRING', description?: string) {
    return tryCatch(db.setting.upsert({
        where: { key },
        update: { value, type, description },
        create: { key, value, type, description }
    }));
}

export async function deleteSetting(key: string) {
    return tryCatch(db.setting.delete({
        where: { key }
    }));
}

// ====== BULK OPERATIONS ======
export async function bulkUpdatePostStatus(postIds: number[], status: PostStatus) {
    return tryCatch(db.post.updateMany({
        where: {
            id: {
                in: postIds
            }
        },
        data: { status }
    }));
}

export async function bulkDeletePosts(postIds: number[]) {
    return tryCatch(db.post.deleteMany({
        where: {
            id: {
                in: postIds
            }
        }
    }));
}

export async function bulkUpdateCommentStatus(commentIds: number[], status: CommentStatus) {
    return tryCatch(db.comment.updateMany({
        where: {
            id: {
                in: commentIds
            }
        },
        data: { status }
    }));
}

export async function bulkDeleteComments(commentIds: number[]) {
    return tryCatch(db.comment.deleteMany({
        where: {
            id: {
                in: commentIds
            }
        }
    }));
}

// ====== CUSTOM POST TYPES ======
export async function createPostType(data: {
    name: string;
    label: string;
    description?: string;
    public?: boolean;
    supports?: string[];
}) {
    return tryCatch(db.postTypeDefinition.create({
        data
    }));
}

export async function createCustomField(data: {
    name: string;
    label: string;
    type: CustomFieldType;
    required?: boolean;
    options?: string;
    postTypeId?: number;
}) {
    return tryCatch(db.customField.create({
        data
    }));
}

// ====== UTILITY FUNCTIONS ======
export async function generateUniqueSlug(title: string, postId?: number) {
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

export async function generateUniqueCategorySlug(name: string, categoryId?: number) {
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

export async function generateUniqueTagSlug(name: string, tagId?: number) {
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
