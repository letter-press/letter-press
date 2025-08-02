import { db } from './db';
import { tryCatch } from "./try-catch";

// ====== SEARCH & FILTERING ======
export async function searchContent(query: string, options?: {
    postTypes?: string[];
    limit?: number;
    offset?: number;
}) {
    "use server";
    const searchTerms = query.split(' ').filter(term => term.length > 2);

    if (searchTerms.length === 0) {
        return tryCatch(Promise.resolve([]));
    }

    // Optimized: Use multiple terms for better search accuracy
    const searchConditions = searchTerms.map(term => ({
        OR: [
            {
                title: {
                    contains: term,
                    mode: 'insensitive' as const
                }
            },
            {
                content: {
                    contains: term,
                    mode: 'insensitive' as const
                }
            },
            {
                excerpt: {
                    contains: term,
                    mode: 'insensitive' as const
                }
            }
        ]
    }));

    const baseWhere = {
        status: 'PUBLISHED' as const,
        AND: searchConditions
    };

    const where = options?.postTypes && options.postTypes.length > 0
        ? {
            ...baseWhere,
            AND: [
                ...searchConditions,
                {
                    OR: [
                        {
                            type: {
                                in: options.postTypes as Array<'POST' | 'PAGE' | 'ATTACHMENT'>
                            }
                        },
                        {
                            customType: {
                                in: options.postTypes
                            }
                        }
                    ]
                }
            ]
        }
        : baseWhere;

    return tryCatch(db.post.findMany({
        where,
        // Optimized: Use select instead of include for better performance
        select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            publishedAt: true,
            type: true,
            customType: true,
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
            }
        },
        take: options?.limit || 20,
        skip: options?.offset || 0,
        orderBy: { publishedAt: 'desc' }
    }));
}

// ====== ARCHIVES ======
export async function getArchives(options?: {
    type?: 'monthly' | 'yearly';
    postType?: string;
    limit?: number;
}) {
    "use server";



    const isYearly = options?.type === 'yearly';

    // Use database-level grouping with raw SQL for optimal performance
    return tryCatch(db.$queryRaw<Array<{ period: string; count: bigint }>>`
        SELECT 
            CASE 
                WHEN ${isYearly} THEN EXTRACT(YEAR FROM "publishedAt")::text
                ELSE TO_CHAR("publishedAt", 'YYYY-MM')
            END as period,
            COUNT(*)::bigint as count
        FROM "Post"
        WHERE "status" = 'PUBLISHED' 
            AND "publishedAt" IS NOT NULL
            ${options?.postType ?
            db.$queryRaw`AND ("type" = ${options.postType} OR "customType" = ${options.postType})` :
            db.$queryRaw``
        }
        GROUP BY period
        ORDER BY period DESC
        ${options?.limit ? db.$queryRaw`LIMIT ${options.limit}` : db.$queryRaw``}
    `.then(data => {
            // Transform results to expected format
            return data.map(item => ({
                period: isYearly
                    ? new Date(`${item.period}-01-01`)
                    : new Date(`${item.period}-01`),
                count: Number(item.count)
            }));
        }));
}

// ====== RELATED CONTENT ======
export async function getRelatedPosts(postId: number, limit = 5) {
    "use server";
    return tryCatch(db.$transaction(async (tx) => {
        // Optimized: Get current post data with minimal fields
        const currentPost = await tx.post.findUnique({
            where: { id: postId },
            select: {
                categories: {
                    select: { categoryId: true }
                },
                tags: {
                    select: { tagId: true }
                }
            }
        });

        if (!currentPost) return [];

        const categoryIds = currentPost.categories.map(pc => pc.categoryId);
        const tagIds = currentPost.tags.map(pt => pt.tagId);

        // Early return if no categories or tags to relate by
        if (categoryIds.length === 0 && tagIds.length === 0) {
            return tx.post.findMany({
                where: {
                    id: { not: postId },
                    status: 'PUBLISHED'
                },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    excerpt: true,
                    publishedAt: true,
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
                    }
                },
                take: limit,
                orderBy: { publishedAt: 'desc' }
            });
        }

        // Build optimized OR conditions based on what's available
        const relationConditions = [];

        if (categoryIds.length > 0) {
            relationConditions.push({
                categories: {
                    some: {
                        categoryId: {
                            in: categoryIds
                        }
                    }
                }
            });
        }

        if (tagIds.length > 0) {
            relationConditions.push({
                tags: {
                    some: {
                        tagId: {
                            in: tagIds
                        }
                    }
                }
            });
        }

        // Find related posts with optimized query
        const relatedPosts = await tx.post.findMany({
            where: {
                id: { not: postId },
                status: 'PUBLISHED',
                OR: relationConditions
            },
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                publishedAt: true,
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
                        categoryId: true,
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
                        tagId: true,
                        tag: {
                            select: {
                                id: true,
                                name: true,
                                slug: true
                            }
                        }
                    }
                }
            },
            take: limit * 3, // Get more to allow for better scoring
            orderBy: { publishedAt: 'desc' }
        });

        // Optimized scoring with Set for faster lookups
        const categorySet = new Set(categoryIds);
        const tagSet = new Set(tagIds);

        const scored = relatedPosts.map(post => {
            let score = 0;

            // Score for shared categories (+2 each)
            for (const pc of post.categories) {
                if (categorySet.has(pc.categoryId)) score += 2;
            }

            // Score for shared tags (+1 each)
            for (const pt of post.tags) {
                if (tagSet.has(pt.tagId)) score += 1;
            }

            return { post, score };
        });

        // Return top scored posts
        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => item.post);
    }));
}

// ====== BREADCRUMBS ======
export async function getBreadcrumbs(type: 'post' | 'category' | 'tag', id: number) {
    "use server";
    const breadcrumbs: Array<{ name: string; url: string }> = [
        { name: 'Home', url: '/' }
    ];

    if (type === 'post') {
        return tryCatch(db.post.findUnique({
            where: { id },
            select: {
                title: true,
                slug: true,
                categories: {
                    select: {
                        categoryId: true
                    },
                    take: 1 // Only need first category for breadcrumb
                }
            }
        }).then(async (post) => {
            if (!post) return breadcrumbs;

            // Add category hierarchy if exists
            if (post.categories.length > 0) {
                const categoryId = post.categories[0].categoryId;

                // Build category path with single query using recursive CTE approach
                const categoryPath = await db.$queryRaw<Array<{ name: string; slug: string; level: number }>>`
                    WITH RECURSIVE category_path AS (
                        SELECT id, name, slug, parent_id, 0 as level
                        FROM "Category"
                        WHERE id = ${categoryId}
                        
                        UNION ALL
                        
                        SELECT c.id, c.name, c.slug, c.parent_id, cp.level + 1
                        FROM "Category" c
                        INNER JOIN category_path cp ON c.id = cp.parent_id
                    )
                    SELECT name, slug, level
                    FROM category_path
                    ORDER BY level DESC
                `;

                categoryPath.forEach(cat => {
                    breadcrumbs.push({
                        name: cat.name,
                        url: `/category/${cat.slug}`
                    });
                });
            }

            // Add current post
            breadcrumbs.push({
                name: post.title,
                url: `/${post.slug}`
            });

            return breadcrumbs;
        }));
    }

    if (type === 'category') {
        return tryCatch(db.$queryRaw<Array<{ name: string; slug: string; level: number }>>`
            WITH RECURSIVE category_path AS (
                SELECT id, name, slug, parent_id, 0 as level
                FROM "Category"
                WHERE id = ${id}
                
                UNION ALL
                
                SELECT c.id, c.name, c.slug, c.parent_id, cp.level + 1
                FROM "Category" c
                INNER JOIN category_path cp ON c.id = cp.parent_id
            )
            SELECT name, slug, level
            FROM category_path
            ORDER BY level DESC
        `.then(categoryPath => {
            categoryPath.forEach(cat => {
                breadcrumbs.push({
                    name: cat.name,
                    url: `/category/${cat.slug}`
                });
            });

            return breadcrumbs;
        }));
    }

    if (type === 'tag') {
        return tryCatch(db.tag.findUnique({
            where: { id },
            select: {
                name: true,
                slug: true
            }
        }).then(tag => {
            if (!tag) return breadcrumbs;

            breadcrumbs.push({
                name: tag.name,
                url: `/tag/${tag.slug}`
            });

            return breadcrumbs;
        }));
    }

    return tryCatch(Promise.resolve(breadcrumbs));
}

// ====== SITE STATISTICS ======
export async function getSiteStats() {
    "use server";
    return tryCatch(db.$transaction(async (tx) => {
        // Use aggregation for post counts by status
        const postCounts = await tx.post.groupBy({
            by: ['status'],
            _count: {
                id: true
            }
        });

        // Use aggregation for comment counts by status
        const commentCounts = await tx.comment.groupBy({
            by: ['status'],
            _count: {
                id: true
            }
        });

        // Get other counts in parallel
        const [totalUsers, totalCategories, totalTags] = await Promise.all([
            tx.user.count(),
            tx.category.count(),
            tx.tag.count()
        ]);

        // Get popular posts and recent posts in parallel
        const [popularPosts, recentPosts] = await Promise.all([
            // Popular posts using aggregated comment counts
            tx.post.findMany({
                where: { status: 'PUBLISHED' },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    publishedAt: true,
                    _count: {
                        select: {
                            comments: {
                                where: { status: 'APPROVED' }
                            }
                        }
                    }
                },
                orderBy: {
                    comments: {
                        _count: 'desc'
                    }
                },
                take: 10
            }),

            // Recent activity with minimal fields
            tx.post.findMany({
                where: { status: 'PUBLISHED' },
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
                },
                orderBy: { publishedAt: 'desc' },
                take: 10
            })
        ]);

        // Transform grouped results to expected format
        const publishedPosts = postCounts.find(p => p.status === 'PUBLISHED')?._count.id || 0;
        const draftPosts = postCounts.find(p => p.status === 'DRAFT')?._count.id || 0;
        const approvedComments = commentCounts.find(c => c.status === 'APPROVED')?._count.id || 0;
        const pendingComments = commentCounts.find(c => c.status === 'PENDING')?._count.id || 0;

        return {
            counts: {
                publishedPosts,
                draftPosts,
                approvedComments,
                pendingComments,
                totalUsers,
                totalCategories,
                totalTags
            },
            popularPosts,
            recentPosts
        };
    }));
}

// ====== MENU/NAVIGATION ======
export async function getNavigationMenu() {
    "use server";
    return tryCatch(db.post.findMany({
        where: {
            type: 'PAGE',
            status: 'PUBLISHED',
            parentId: null
        },
        select: {
            id: true,
            title: true,
            slug: true,
            menuOrder: true,
            children: {
                where: {
                    status: 'PUBLISHED'
                },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    menuOrder: true
                },
                orderBy: { menuOrder: 'asc' }
            }
        },
        orderBy: { menuOrder: 'asc' }
    }));
}

// ====== CONTENT VALIDATION ======
// Note: validateSlug, sanitizeHtml, and generateExcerpt are now imported from the plugin SDK
// These utilities are available through the plugin-types export

// ====== CACHE INVALIDATION HELPERS ======
export async function invalidatePostCache(postId: number) {
    "use server";
    // Implementation depends on your caching strategy
    // This is a placeholder for cache invalidation logic
    return tryCatch(Promise.resolve({
        postId,
        invalidated: true,
        timestamp: new Date()
    }));
}

export async function invalidateCategoryCache(categoryId: number) {
    "use server";
    return tryCatch(Promise.resolve({
        categoryId,
        invalidated: true,
        timestamp: new Date()
    }));
}
