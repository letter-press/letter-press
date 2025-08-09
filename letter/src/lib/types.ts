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
    CustomFieldType,
    ContentBlock,
    BlockTemplate,
    BlockType
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
    blocks?: ContentBlockWithChildren[];
    _count?: {
        comments: number;
    };
};

// Subset of PostWithRelations for list views (admin panels)
export type PostListItem = Pick<Post, 'id' | 'title' | 'slug' | 'excerpt' | 'status' | 'type' | 'customType' | 'publishedAt' | 'createdAt' | 'updatedAt'> & {
    author: {
        id: number;
        username: string | null;
        name: string | null;
        image: string | null;
    };
    categories: Array<{
        category: {
            id: number;
            name: string;
            slug: string;
        };
    }>;
    tags: Array<{
        tag: {
            id: number;
            name: string;
            slug: string;
        };
    }>;
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

// ====== BLOCK SYSTEM TYPES ======
export type ContentBlockWithChildren = ContentBlock & {
    children?: ContentBlockWithChildren[];
};

// Import optimized content types
export type { OptimizedBlockContent, OptimizedBlockAttributes } from './content-optimization';

// Block content types for different block types
export interface ParagraphBlockContent {
    text: string;
    html?: string; // Rich HTML content from Squire
    format?: {
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        strikethrough?: boolean;
        color?: string;
        backgroundColor?: string;
        fontSize?: string;
        textAlign?: 'left' | 'center' | 'right' | 'justify';
    };
}

export interface HeadingBlockContent {
    text: string;
    html?: string; // Rich HTML content from Squire
    level: 1 | 2 | 3 | 4 | 5 | 6;
    format?: {
        color?: string;
        textAlign?: 'left' | 'center' | 'right';
    };
}

export interface ImageBlockContent {
    url: string;
    alt?: string;
    caption?: string;
    width?: number;
    height?: number;
}

export interface QuoteBlockContent {
    text: string;
    html?: string; // Rich HTML content from Squire
    citation?: string;
    format?: {
        style?: 'default' | 'large' | 'pull';
    };
}

export interface CodeBlockContent {
    code: string;
    language?: string;
    showLineNumbers?: boolean;
}

export interface ListBlockContent {
    type: 'ordered' | 'unordered';
    items: Array<{
        text: string;
        children?: ListBlockContent;
    }>;
}

export interface ButtonBlockContent {
    text: string;
    html?: string; // Rich HTML content from Squire
    url?: string;
    style?: 'primary' | 'secondary' | 'outline';
    size?: 'small' | 'medium' | 'large';
    alignment?: 'left' | 'center' | 'right';
    format?: {
        color?: string;
        backgroundColor?: string;
    };
}

export interface ColumnsBlockContent {
    columns: number;
    gap?: 'small' | 'medium' | 'large';
}

export interface VideoBlockContent {
    url: string;
    poster?: string;
    autoplay?: boolean;
    controls?: boolean;
    caption?: string;
    alt?: string;
    width?: number;
    height?: number;
}

export interface AudioBlockContent {
    url: string;
    caption?: string;
    alt?: string;
    width?: number;
    height?: number;
    autoplay?: boolean;
    loop?: boolean;
}

export interface GalleryBlockContent {
    images: Array<{
        url: string;
        alt?: string;
        caption?: string;
    }>;
    columns?: number;
    linkTo?: 'none' | 'attachment' | 'media';
}

export interface EmbedBlockContent {
    url: string;
    type?: 'youtube' | 'vimeo' | 'twitter' | 'instagram' | 'generic';
    width?: number;
    height?: number;
    caption?: string;
    alt?: string;
}

export interface RichTextBlockContent {
    text: string;
    html?: string; // Rich HTML content from Squire
    format?: {
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        strikethrough?: boolean;
        color?: string;
        backgroundColor?: string;
        fontSize?: string;
        fontFamily?: string;
        textAlign?: 'left' | 'center' | 'right' | 'justify';
        lineHeight?: string;
        letterSpacing?: string;
    };
}

// Union type for all block content types
export type BlockContent = 
    | ParagraphBlockContent
    | HeadingBlockContent
    | ImageBlockContent
    | QuoteBlockContent
    | CodeBlockContent
    | ListBlockContent
    | ButtonBlockContent
    | ColumnsBlockContent
    | VideoBlockContent
    | AudioBlockContent
    | GalleryBlockContent
    | EmbedBlockContent
    | RichTextBlockContent
    | Record<string, any>; // For custom blocks

// Block attributes for styling and configuration
export interface BlockAttributes {
    className?: string;
    id?: string;
    margin?: {
        top?: string;
        bottom?: string;
        left?: string;
        right?: string;
    };
    padding?: {
        top?: string;
        bottom?: string;
        left?: string;
        right?: string;
    };
    backgroundColor?: string;
    textColor?: string;
    width?: string;
    anchor?: string;
    [key: string]: any; // For custom attributes
}

// Block definition for the editor
export interface BlockDefinition {
    type: BlockType | string;
    name: string;
    title: string;
    description?: string;
    icon: string;
    category: 'text' | 'media' | 'layout' | 'embed' | 'widget' | 'custom';
    supports: {
        html?: boolean;
        align?: boolean;
        anchor?: boolean;
        customClassName?: boolean;
        reusable?: boolean;
    };
    defaultContent?: BlockContent;
    defaultAttributes?: BlockAttributes;
    component: any; // SolidJS component for editing
    render?: any; // SolidJS component for frontend rendering
}

// Block registry for managing available blocks
export interface BlockRegistry {
    [blockType: string]: BlockDefinition;
}

// Plugin block registration
export interface PluginBlockDefinition extends Omit<BlockDefinition, 'type'> {
    type: string; // Custom type name
    pluginId: string;
}

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
    popularPosts: Array<{
        id: number;
        title: string;
        slug: string;
        publishedAt: Date | null;
        _count?: {
            comments: number;
        };
    }>;
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

// Color palette with simple descriptive names
export interface ThemeColors {
    // Index signature for Prisma JSON compatibility
    [key: string]: string;
    
    // Primary colors
    primary: string;
    secondary: string;
    accent: string;
    
    // Text colors
    text: string;
    textSecondary: string;
    textMuted: string;
    
    // Background colors
    background: string;
    surface: string;
    surfaceSecondary: string;
    
    // Border colors
    border: string;
    borderLight: string;
    
    // State colors
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Semantic colors for blocks
    highlight: string;
    quote: string;
    code: string;
    codeBackground: string;
}

// Theme configuration with database support
export interface ThemeConfig {
    id?: number;
    name: string;
    displayName: string;
    description?: string;
    author?: string;
    version: string;
    
    // Theme capabilities
    supportsDarkMode: boolean;
    isActive?: boolean;
    isBuiltIn?: boolean;
    
    // Color configuration
    colors: ThemeColors;
    darkColors?: ThemeColors; // Optional dark mode colors
    
    // Layout and styling
    layouts?: {
        default?: string;
        home?: string;
        page?: string;
        post?: string;
        [key: string]: string | undefined;
    };
    customCSS?: string;
}

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
    CustomFieldType,
    ContentBlock,
    BlockTemplate,
    BlockType
};
