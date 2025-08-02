
"use server";

import { db } from './db'
import { tryCatch } from "./try-catch";
import type { PostStatus, PostType, UserRole, CommentStatus, Prisma } from '@prisma/client';

// ====== USER QUERIES ======
export async function getUser(id: number) {
    return tryCatch(db.user.findUnique({
        where: { id },
        select: {
            id: true,
            role: true,
            username: true,
            name: true,
            email: true,
            image: true
        }
    }))
}

export async function getFullUser(id: number) {
    "use server";
    return tryCatch(db.user.findFirst({
        where: { id }
    }));
}

export async function getUserByEmail(email: string) {
    "use server";
    return tryCatch(db.user.findUnique({
        where: { email }
    }));
}

export async function getUserByUsername(username: string) {
    "use server";
    return tryCatch(db.user.findUnique({
        where: { username }
    }));
}

export async function getUsers(options?: {
    role?: UserRole;
    limit?: number;
    offset?: number;
}) {
    "use server";
    return tryCatch(db.user.findMany({
        where: options?.role ? { role: options.role } : undefined,
        select: {
            id: true,
            username: true,
            name: true,
            email: true,
            role: true,
            image: true,
            createdAt: true,
            _count: {
                select: {
                    posts: true,
                    comments: true
                }
            }
        },
        take: options?.limit || 20,
        skip: options?.offset || 0,
        orderBy: { createdAt: 'desc' }
    }));
}

// ====== POST QUERIES ======
export async function getPost(id: number) {
    "use server";
    return tryCatch(db.post.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            slug: true,
            content: true,
            excerpt: true,
            status: true,
            type: true,
            customType: true,
            publishedAt: true,
            createdAt: true,
            updatedAt: true,
            menuOrder: true,
            parentId: true,
            author: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                    image: true
                }
            },
            categories: {
                select: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            description: true
                        }
                    }
                }
            },
            tags: {
                select: {
                    tag: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            description: true
                        }
                    }
                }
            },
            postMeta: {
                select: {
                    id: true,
                    metaKey: true,
                    metaValue: true
                }
            },
            _count: {
                select: {
                    comments: {
                        where: {
                            status: 'APPROVED'
                        }
                    }
                }
            }
        }
    }));
}

export async function getPostBySlug(slug: string) {
    "use server";
    return tryCatch(db.post.findUnique({
        where: { slug },
        select: {
            id: true,
            title: true,
            slug: true,
            content: true,
            excerpt: true,
            status: true,
            type: true,
            customType: true,
            publishedAt: true,
            createdAt: true,
            updatedAt: true,
            menuOrder: true,
            parentId: true,
            author: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                    image: true
                }
            },
            categories: {
                select: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            description: true
                        }
                    }
                }
            },
            tags: {
                select: {
                    tag: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            description: true
                        }
                    }
                }
            },
            postMeta: {
                select: {
                    id: true,
                    metaKey: true,
                    metaValue: true
                }
            }
        }
    }));
}

export async function getPosts(options?: {
    status?: PostStatus;
    type?: PostType;
    authorId?: number;
    categoryId?: number;
    tagId?: number;
    search?: string;
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'publishedAt' | 'title';
    orderDirection?: 'asc' | 'desc';
}) {
    "use server";
    // Optimized: Build where clause more efficiently
    const where: Prisma.PostWhereInput = {};
    
    // Basic filters
    if (options?.status) where.status = options.status;
    if (options?.type) where.type = options.type;
    if (options?.authorId) where.authorId = options.authorId;
    
    // Relation filters
    if (options?.categoryId) {
        where.categories = {
            some: {
                categoryId: options.categoryId
            }
        };
    }
    if (options?.tagId) {
        where.tags = {
            some: {
                tagId: options.tagId
            }
        };
    }
    
    // Search optimization
    if (options?.search) {
        const searchTerms = options.search.split(' ').filter(term => term.length > 2);
        if (searchTerms.length > 0) {
            where.AND = searchTerms.map(term => ({
                OR: [
                    { title: { contains: term, mode: 'insensitive' } },
                    { content: { contains: term, mode: 'insensitive' } },
                    { excerpt: { contains: term, mode: 'insensitive' } }
                ]
            }));
        }
    }

    const orderBy = options?.orderBy || 'createdAt';
    const orderDirection = options?.orderDirection || 'desc';

    return tryCatch(db.post.findMany({
        where,
        select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            status: true,
            type: true,
            customType: true,
            publishedAt: true,
            createdAt: true,
            updatedAt: true,
            author: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                    image: true
                }
            },
            categories: {
                select: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    }
                }
            },
            tags: {
                select: {
                    tag: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    }
                }
            },
            _count: {
                select: {
                    comments: {
                        where: { status: 'APPROVED' }
                    }
                }
            }
        },
        orderBy: { [orderBy]: orderDirection },
        take: options?.limit || 20,
        skip: options?.offset || 0
    }));
}

export async function getPublishedPosts(options?: {
    limit?: number;
    offset?: number;
    categorySlug?: string;
    tagSlug?: string;
}) {
    "use server";
    const where: Prisma.PostWhereInput = {
        status: 'PUBLISHED',
        publishedAt: {
            lte: new Date()
        }
    };

    if (options?.categorySlug) {
        where.categories = {
            some: {
                category: {
                    slug: options.categorySlug
                }
            }
        };
    }

    if (options?.tagSlug) {
        where.tags = {
            some: {
                tag: {
                    slug: options.tagSlug
                }
            }
        };
    }

    return tryCatch(db.post.findMany({
        where,
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                    image: true
                }
            },
            categories: {
                include: {
                    category: true
                }
            },
            tags: {
                include: {
                    tag: true
                }
            },
            _count: {
                select: {
                    comments: {
                        where: {
                            status: 'APPROVED'
                        }
                    }
                }
            }
        },
        take: options?.limit || 10,
        skip: options?.offset || 0,
        orderBy: { publishedAt: 'desc' }
    }));
}

export async function getFeaturedPosts(limit = 5) {
    "use server";
    return tryCatch(db.post.findMany({
        where: {
            status: 'PUBLISHED',
            publishedAt: {
                lte: new Date()
            },
            featuredImage: {
                not: null
            }
        },
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                    image: true
                }
            },
            categories: {
                include: {
                    category: true
                }
            }
        },
        take: limit,
        orderBy: { publishedAt: 'desc' }
    }));
}

// ====== CATEGORY QUERIES ======
export async function getCategories() {
    "use server";
    return tryCatch(db.category.findMany({
        include: {
            parent: true,
            children: true,
            _count: {
                select: {
                    posts: {
                        where: {
                            post: {
                                status: 'PUBLISHED'
                            }
                        }
                    }
                }
            }
        },
        orderBy: { name: 'asc' }
    }));
}

export async function getCategory(id: number) {
    "use server";
    return tryCatch(db.category.findUnique({
        where: { id },
        include: {
            parent: true,
            children: true,
            _count: {
                select: {
                    posts: {
                        where: {
                            post: {
                                status: 'PUBLISHED'
                            }
                        }
                    }
                }
            }
        }
    }));
}

export async function getCategoryBySlug(slug: string) {
    "use server";
    return tryCatch(db.category.findUnique({
        where: { slug },
        include: {
            parent: true,
            children: true,
            _count: {
                select: {
                    posts: {
                        where: {
                            post: {
                                status: 'PUBLISHED'
                            }
                        }
                    }
                }
            }
        }
    }));
}

// ====== TAG QUERIES ======
export async function getTags() {
    "use server";
    return tryCatch(db.tag.findMany({
        include: {
            _count: {
                select: {
                    posts: {
                        where: {
                            post: {
                                status: 'PUBLISHED'
                            }
                        }
                    }
                }
            }
        },
        orderBy: { name: 'asc' }
    }));
}

export async function getTag(id: number) {
    "use server";
    return tryCatch(db.tag.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    posts: {
                        where: {
                            post: {
                                status: 'PUBLISHED'
                            }
                        }
                    }
                }
            }
        }
    }));
}

export async function getTagBySlug(slug: string) {
    "use server";
    return tryCatch(db.tag.findUnique({
        where: { slug },
        include: {
            _count: {
                select: {
                    posts: {
                        where: {
                            post: {
                                status: 'PUBLISHED'
                            }
                        }
                    }
                }
            }
        }
    }));
}

export async function getPopularTags(limit = 20) {
    "use server";
    return tryCatch(db.tag.findMany({
        include: {
            _count: {
                select: {
                    posts: {
                        where: {
                            post: {
                                status: 'PUBLISHED'
                            }
                        }
                    }
                }
            }
        },
        orderBy: {
            posts: {
                _count: 'desc'
            }
        },
        take: limit
    }));
}

// ====== COMMENT QUERIES ======
export async function getComments(postId?: number, options?: {
    status?: CommentStatus;
    limit?: number;
    offset?: number;
}) {
    "use server";
    const where: Prisma.CommentWhereInput = {};
    
    if (postId) where.postId = postId;
    if (options?.status) where.status = options.status;

    return tryCatch(db.comment.findMany({
        where,
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                    image: true
                }
            },
            post: {
                select: {
                    id: true,
                    title: true,
                    slug: true
                }
            },
            parent: true,
            children: {
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            name: true,
                            image: true
                        }
                    }
                }
            }
        },
        take: options?.limit || 20,
        skip: options?.offset || 0,
        orderBy: { createdAt: 'desc' }
    }));
}

export async function getApprovedComments(postId: number) {
    "use server";
    return tryCatch(db.comment.findMany({
        where: {
            postId,
            status: 'APPROVED',
            parentId: null // Only top-level comments
        },
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                    image: true
                }
            },
            children: {
                where: {
                    status: 'APPROVED'
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            name: true,
                            image: true
                        }
                    }
                },
                orderBy: { createdAt: 'asc' }
            }
        },
        orderBy: { createdAt: 'desc' }
    }));
}

// ====== SETTINGS QUERIES ======
export async function getSetting(key: string) {
    "use server";
    return tryCatch(db.setting.findUnique({
        where: { key }
    }));
}

export async function getSettings() {
    "use server";
    return tryCatch(db.setting.findMany({
        orderBy: { key: 'asc' }
    }));
}

// ====== DASHBOARD/STATS QUERIES ======
export async function getDashboardStats() {
    "use server";
    return tryCatch(Promise.all([
        db.post.count({ where: { status: 'PUBLISHED' } }),
        db.post.count({ where: { status: 'DRAFT' } }),
        db.comment.count({ where: { status: 'PENDING' } }),
        db.user.count(),
        db.post.findMany({
            where: { status: 'PUBLISHED' },
            take: 5,
            orderBy: { publishedAt: 'desc' },
            select: {
                id: true,
                title: true,
                slug: true,
                publishedAt: true,
                author: {
                    select: {
                        name: true,
                        username: true
                    }
                }
            }
        }),
        db.comment.findMany({
            where: { status: 'PENDING' },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                content: true,
                authorName: true,
                createdAt: true,
                post: {
                    select: {
                        title: true,
                        slug: true
                    }
                }
            }
        })
    ]).then(([
        publishedPosts,
        draftPosts,
        pendingComments,
        totalUsers,
        recentPosts,
        recentComments
    ]) => ({
        publishedPosts,
        draftPosts,
        pendingComments,
        totalUsers,
        recentPosts,
        recentComments
    })));
}