import type { 
    User, 
    Post, 
    Category, 
    Tag, 
    Comment, 
    PostMeta, 
    PostCategory, 
    PostTag, 
    Setting,
    PostTypeDefinition,
    CustomField,
    UserRole,
    PostStatus,
    PostType,
    CommentStatus,
    PostMetaType,
    CustomFieldType
} from '@prisma/client';

// ====== EXTENDED TYPES WITH RELATIONS ======
export type UserWithCounts = User & {
    _count: {
        posts: number;
        comments: number;
    };
};

export type PostWithRelations = Post & {
    author: {
        id: number;
        username: string | null;
        name: string | null;
        image: string | null;
    };
    categories: Array<PostCategory & {
        category: Category;
    }>;
    tags: Array<PostTag & {
        tag: Tag;
    }>;
    postMeta?: PostMeta[];
    _count?: {
        comments: number;
    };
};

export type CategoryWithCounts = Category & {
    parent?: Category | null;
    children?: Category[];
    _count: {
        posts: number;
    };
};

export type TagWithCounts = Tag & {
    _count: {
        posts: number;
    };
};

export type CommentWithRelations = Comment & {
    author?: {
        id: number;
        username: string | null;
        name: string | null;
        image: string | null;
    } | null;
    post: {
        id: number;
        title: string;
        slug: string;
    };
    parent?: Comment | null;
    children?: CommentWithRelations[];
};

export type PostTypeWithFields = PostTypeDefinition & {
    customFields: CustomField[];
};

// ====== API RESPONSE TYPES ======
export type ApiResponse<T> = {
    data: T;
    error: never;
} | {
    error: Error;
    data: never;
};

export type PaginatedResponse<T> = {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
};

// ====== FORM DATA TYPES ======
export type CreatePostData = {
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
};

export type UpdatePostData = Partial<CreatePostData>;

export type CreateCommentData = {
    postId: number;
    parentId?: number;
    authorId?: number;
    authorName: string;
    authorEmail: string;
    authorUrl?: string;
    content: string;
    authorIp?: string;
    agent?: string;
};

export type UpdateCommentData = {
    content?: string;
    status?: CommentStatus;
    authorName?: string;
    authorEmail?: string;
    authorUrl?: string;
};

export type CreateCategoryData = {
    name: string;
    slug: string;
    description?: string;
    parentId?: number;
};

export type UpdateCategoryData = Partial<CreateCategoryData>;

export type CreateTagData = {
    name: string;
    slug: string;
    description?: string;
};

export type UpdateTagData = Partial<CreateTagData>;

// ====== SEARCH & FILTER TYPES ======
export type SearchOptions = {
    postTypes?: string[];
    limit?: number;
    offset?: number;
};

export type PostFilters = {
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
};

export type PublishedPostFilters = {
    limit?: number;
    offset?: number;
    categorySlug?: string;
    tagSlug?: string;
};

export type CommentFilters = {
    status?: CommentStatus;
    limit?: number;
    offset?: number;
};

export type UserFilters = {
    role?: UserRole;
    limit?: number;
    offset?: number;
};

// ====== DASHBOARD TYPES ======
export type DashboardStats = {
    publishedPosts: number;
    draftPosts: number;
    pendingComments: number;
    totalUsers: number;
    recentPosts: Array<{
        id: number;
        title: string;
        slug: string;
        publishedAt: Date | null;
        author: {
            name: string | null;
            username: string | null;
        };
    }>;
    recentComments: Array<{
        id: number;
        content: string;
        authorName: string;
        createdAt: Date;
        post: {
            title: string;
            slug: string;
        };
    }>;
};

export type SiteStats = {
    counts: {
        publishedPosts: number;
        draftPosts: number;
        approvedComments: number;
        pendingComments: number;
        totalUsers: number;
        totalCategories: number;
        totalTags: number;
    };
    popularPosts: PostWithRelations[];
    recentPosts: Array<{
        id: number;
        title: string;
        slug: string;
        publishedAt: Date | null;
        author: {
            name: string | null;
            username: string | null;
        };
    }>;
};

// ====== NAVIGATION TYPES ======
export type Breadcrumb = {
    name: string;
    url: string;
};

export type NavigationItem = Post & {
    children?: NavigationItem[];
};

// ====== ARCHIVE TYPES ======
export type ArchiveItem = {
    period: Date;
    count: number;
};

export type ArchiveOptions = {
    type?: 'monthly' | 'yearly';
    postType?: string;
    limit?: number;
};

// ====== BULK OPERATION TYPES ======
export type BulkAction = 'publish' | 'unpublish' | 'delete' | 'approve' | 'reject' | 'spam';

export type BulkPostAction = {
    action: 'publish' | 'unpublish' | 'delete';
    postIds: number[];
};

export type BulkCommentAction = {
    action: 'approve' | 'reject' | 'spam' | 'delete';
    commentIds: number[];
};

// ====== CUSTOM FIELD TYPES ======
export type CustomFieldValue = {
    fieldId: number;
    value: string | number | boolean | object;
};

export type CustomFieldDefinition = CustomField & {
    postType?: PostTypeDefinition;
};

// ====== MEDIA TYPES ======
export type MediaFile = {
    id: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    alt?: string;
    caption?: string;
    description?: string;
};

// ====== FORM VALIDATION TYPES ======
export type ValidationError = {
    field: string;
    message: string;
};

export type FormErrors<T> = {
    [K in keyof T]?: string;
};

// ====== THEME/TEMPLATE TYPES ======
export type ThemeSettings = {
    siteName: string;
    siteDescription: string;
    logoUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    postsPerPage: number;
    commentsEnabled: boolean;
    registrationEnabled: boolean;
};

// Re-export Prisma types for convenience
export type {
    User,
    Post,
    Category,
    Tag,
    Comment,
    PostMeta,
    Setting,
    PostTypeDefinition,
    CustomField,
    UserRole,
    PostStatus,
    PostType,
    CommentStatus,
    PostMetaType,
    CustomFieldType
};
