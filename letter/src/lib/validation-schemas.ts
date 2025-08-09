import { type } from "arktype";

// Color validation - must be valid hex color
export const ColorSchema = type("string").narrow((s, problems) => {
  const hexColorRegex = /^#([A-Fa-f0-9]{3}){1,2}$/;
  return hexColorRegex.test(s) || problems.mustBe("a valid hex color (e.g., #FF0000)");
});

// Theme colors schema with all required color properties
export const ThemeColorsSchema = type({
  primary: ColorSchema,
  secondary: ColorSchema,
  accent: ColorSchema,
  text: ColorSchema,
  textSecondary: ColorSchema,
  textMuted: ColorSchema,
  background: ColorSchema,
  surface: ColorSchema,
  surfaceSecondary: ColorSchema,
  border: ColorSchema,
  borderLight: ColorSchema,
  success: ColorSchema,
  warning: ColorSchema,
  error: ColorSchema,
  info: ColorSchema,
  highlight: ColorSchema,
  quote: ColorSchema,
  code: ColorSchema,
  codeBackground: ColorSchema,
});

// Layout configuration schema
export const LayoutConfigSchema = type({
  default: "string",
  home: "string", 
  page: "string",
  post: "string",
});

// Base theme configuration schema
export const ThemeConfigSchema = type({
  name: "string",
  displayName: "string",
  description: "string?",
  author: "string?", 
  version: "string",
  supportsDarkMode: "boolean",
  isBuiltIn: "boolean?",
  layouts: LayoutConfigSchema,
  colors: ThemeColorsSchema,
  darkColors: ThemeColorsSchema.or("undefined"),
  customCSS: "string?",
}).narrow((theme, problems) => {
  // Theme name validation (lowercase, alphanumeric, hyphens only)
  if (!/^[a-z0-9-]+$/.test(theme.name)) {
    return problems.mustBe("name must contain only lowercase letters, numbers, and hyphens");
  }
  
  // Display name validation (non-empty)
  if (!theme.displayName.trim()) {
    return problems.mustBe("displayName cannot be empty");
  }
  
  // Version validation (semver-like format)
  if (!/^\d+\.\d+\.\d+$/.test(theme.version)) {
    return problems.mustBe("version must be in format x.y.z (e.g., 1.0.0)");
  }
  
  return true;
});

// Theme save request schema (includes optional id for updates)
export const ThemeSaveRequestSchema = type({
  name: "string",
  displayName: "string",
  description: "string?",
  author: "string?", 
  version: "string",
  supportsDarkMode: "boolean",
  isBuiltIn: "boolean?",
  layouts: LayoutConfigSchema,
  colors: ThemeColorsSchema,
  darkColors: ThemeColorsSchema.or("undefined"),
  customCSS: "string?",
  id: "number?"
});

// Theme activation request schema
export const ThemeActivationRequestSchema = type({
  themeName: "string"
}).narrow((req, problems) => {
  if (!/^[a-z0-9-]+$/.test(req.themeName)) {
    return problems.mustBe("themeName must contain only lowercase letters, numbers, and hyphens");
  }
  return true;
});

// Theme deletion request schema
export const ThemeDeletionRequestSchema = type({
  themeId: "number"
}).narrow((req, problems) => {
  if (req.themeId <= 0) {
    return problems.mustBe("themeId must be a positive integer");
  }
  return true;
});

// Custom field validation schemas
export const CustomFieldSchema = type({
  name: "string",
  label: "string", 
  type: "'TEXT' | 'TEXTAREA' | 'NUMBER' | 'DATE' | 'SELECT' | 'CHECKBOX' | 'JSON' | 'FILE' | 'FILE_IMAGE' | 'FILE_VIDEO' | 'FILE_AUDIO' | 'FILE_PDF' | 'FILE_WORD' | 'FILE_EXCEL' | 'FILE_PPT' | 'FILE_OTHER' | 'HTML'",
  required: "boolean",
  options: "string?",
  postTypeId: "number?"
}).narrow((field, problems) => {
  // Field name validation (alphanumeric and underscores only)
  if (!/^[a-zA-Z0-9_]+$/.test(field.name)) {
    return problems.mustBe("name must contain only letters, numbers, and underscores");
  }
  
  // Label validation (non-empty)
  if (!field.label.trim()) {
    return problems.mustBe("label cannot be empty");
  }
  
  // Options validation for SELECT type
  if (field.type === 'SELECT' && !field.options) {
    return problems.mustBe("SELECT fields must have options defined");
  }
  
  return true;
});

// User role validation
export const UserRoleSchema = type("'ADMIN' | 'EDITOR' | 'AUTHOR' | 'CONTRIBUTOR' | 'SUBSCRIBER'");

// Post status validation  
export const PostStatusSchema = type("'DRAFT' | 'PUBLISHED' | 'PRIVATE' | 'TRASH' | 'REVIEW'");

// Generic pagination schema
export const PaginationSchema = type({
  page: "number",
  limit: "number"
}).narrow((pagination, problems) => {
  if (pagination.page < 1) {
    return problems.mustBe("page must be at least 1");
  }
  if (pagination.limit < 1 || pagination.limit > 100) {
    return problems.mustBe("limit must be between 1 and 100");
  }
  return true;
});

// Email validation schema
export const EmailSchema = type("string").narrow((s, problems) => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
    return problems.mustBe("a valid email address");
  }
  return true;
});

// Password validation schema
export const PasswordSchema = type("string").narrow((s, problems) => {
  if (s.length < 8) {
    return problems.mustBe("at least 8 characters long");
  }
  return true;
});

// URL validation schema
export const URLSchema = type("string").narrow((s, problems) => {
  try {
    new URL(s);
    return true;
  } catch {
    return problems.mustBe("a valid URL");
  }
});

// Slug validation schema
export const SlugSchema = type("string").narrow((s, problems) => {
  if (!/^[a-z0-9-]+$/.test(s)) {
    return problems.mustBe("a valid slug (lowercase letters, numbers, and hyphens only)");
  }
  return true;
});

// Positive integer schema
export const PositiveIntegerSchema = type("number").narrow((n, problems) => {
  if (!Number.isInteger(n) || n <= 0) {
    return problems.mustBe("a positive integer");
  }
  return true;
});

// Non-negative integer schema
export const NonNegativeIntegerSchema = type("number").narrow((n, problems) => {
  if (!Number.isInteger(n) || n < 0) {
    return problems.mustBe("a non-negative integer");
  }
  return true;
});

// Post type schema
export const PostTypeSchema = type("'POST' | 'PAGE'");

// Comment status schema
export const CommentStatusSchema = type("'PENDING' | 'APPROVED' | 'SPAM' | 'TRASH'");

// Meta type schema
export const MetaTypeSchema = type("'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ARRAY'");

// File size validation (10MB max)
export const FileSizeSchema = type("number").narrow((size, problems) => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (size > MAX_SIZE) {
    return problems.mustBe("less than 10MB");
  }
  return true;
});

// MIME type validation for allowed file types
export const AllowedMimeTypeSchema = type("string").narrow((mimeType, problems) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm',
    'audio/mp3', 'audio/wav', 'audio/ogg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(mimeType)) {
    return problems.mustBe("an allowed file type");
  }
  return true;
});

// ===== USER SCHEMAS =====

// User registration schema
export const UserRegistrationSchema = type({
  email: EmailSchema,
  password: PasswordSchema,
  name: "string?"
}).narrow((user, problems) => {
  if (user.name && user.name.trim().length === 0) {
    return problems.mustBe("name cannot be empty if provided");
  }
  return true;
});

// User role update schema
export const UserRoleUpdateSchema = type({
  userId: PositiveIntegerSchema,
  role: UserRoleSchema
});

// User query schema
export const UserQuerySchema = type({
  page: "number?",
  limit: "number?", 
  role: "string?",
  search: "string?"
}).narrow((query, problems) => {
  if (query.page !== undefined && query.page < 1) {
    return problems.mustBe("page must be at least 1");
  }
  if (query.limit !== undefined && (query.limit < 1 || query.limit > 100)) {
    return problems.mustBe("limit must be between 1 and 100");
  }
  return true;
});

// ===== POST SCHEMAS =====

// Post creation schema base for type inference
export const PostCreateSchema = type({
  title: "string",
  content: "string?",
  excerpt: "string?",
  slug: SlugSchema,
  status: PostStatusSchema.or("undefined"),
  type: PostTypeSchema.or("undefined"),
  customType: "string?",
  featuredImage: PositiveIntegerSchema.or("undefined"),
  authorId: PositiveIntegerSchema,
  parentId: PositiveIntegerSchema.or("undefined"),
  menuOrder: NonNegativeIntegerSchema.or("undefined"),
  commentStatus: "boolean?",
  pingStatus: "boolean?",
  publishedAt: "string?", // ISO date string
  categoryIds: "number[]?",
  tagIds: "number[]?",
  meta: "unknown[]?", // Will validate array elements separately
  blocks: "unknown[]?" // Will validate array elements separately
}).narrow((post, problems) => {
  if (!post.title.trim()) {
    return problems.mustBe("title cannot be empty");
  }
  
  if (post.publishedAt) {
    const date = new Date(post.publishedAt);
    if (isNaN(date.getTime())) {
      return problems.mustBe("publishedAt must be a valid ISO date string");
    }
  }
  
  return true;
});

// Post update schema (all fields optional except id)
export const PostUpdateSchema = type({
  id: PositiveIntegerSchema,
  title: "string?",
  content: "string?", 
  excerpt: "string?",
  slug: SlugSchema.or("undefined"),
  status: PostStatusSchema.or("undefined"),
  type: PostTypeSchema.or("undefined"),
  customType: "string?",
  featuredImage: PositiveIntegerSchema.or("undefined"),
  parentId: PositiveIntegerSchema.or("undefined"),
  menuOrder: NonNegativeIntegerSchema.or("undefined"),
  commentStatus: "boolean?",
  pingStatus: "boolean?",
  publishedAt: "string?",
  categoryIds: "number[]?",
  tagIds: "number[]?",
  meta: "unknown[]?",
  blocks: "unknown[]?"
});

// Bulk operations schema
export const BulkPostOperationSchema = type({
  postIds: "number[]",
  status: PostStatusSchema.or("undefined")
}).narrow((operation, problems) => {
  if (operation.postIds.length === 0) {
    return problems.mustBe("postIds cannot be empty");
  }
  return true;
});

// ===== CATEGORY/TAG SCHEMAS =====

// Category creation schema
export const CategoryCreateSchema = type({
  name: "string",
  slug: SlugSchema,
  description: "string?",
  parentId: PositiveIntegerSchema.or("undefined")
}).narrow((category, problems) => {
  if (!category.name.trim()) {
    return problems.mustBe("name cannot be empty");
  }
  return true;
});

// Category update schema
export const CategoryUpdateSchema = type({
  id: PositiveIntegerSchema,
  name: "string?",
  slug: SlugSchema.or("undefined"),
  description: "string?",
  parentId: PositiveIntegerSchema.or("undefined")
});

// Tag creation schema
export const TagCreateSchema = type({
  name: "string",
  slug: SlugSchema,
  description: "string?"
}).narrow((tag, problems) => {
  if (!tag.name.trim()) {
    return problems.mustBe("name cannot be empty");
  }
  return true;
});

// Tag update schema
export const TagUpdateSchema = type({
  id: PositiveIntegerSchema,
  name: "string?",
  slug: SlugSchema.or("undefined"),
  description: "string?"
});

// ===== COMMENT SCHEMAS =====

// Comment creation schema
export const CommentCreateSchema = type({
  postId: PositiveIntegerSchema,
  parentId: PositiveIntegerSchema.or("undefined"),
  authorId: PositiveIntegerSchema.or("undefined"),
  authorName: "string",
  authorEmail: EmailSchema,
  authorUrl: URLSchema.or("undefined"),
  content: "string",
  authorIp: "string?",
  agent: "string?"
}).narrow((comment, problems) => {
  if (!comment.content.trim()) {
    return problems.mustBe("content cannot be empty");
  }
  if (!comment.authorName.trim()) {
    return problems.mustBe("authorName cannot be empty");
  }
  return true;
});

// Comment update schema
export const CommentUpdateSchema = type({
  id: PositiveIntegerSchema,
  content: "string?",
  status: CommentStatusSchema.or("undefined"),
  authorName: "string?",
  authorEmail: EmailSchema.or("undefined"),
  authorUrl: URLSchema.or("undefined")
});

// Bulk comment operations schema
export const BulkCommentOperationSchema = type({
  commentIds: "number[]",
  status: CommentStatusSchema.or("undefined")
}).narrow((operation, problems) => {
  if (operation.commentIds.length === 0) {
    return problems.mustBe("commentIds cannot be empty");
  }
  return true;
});

// ===== SETTINGS SCHEMA =====

// Setting update schema
export const SettingUpdateSchema = type({
  key: "string",
  value: "string",
  type: MetaTypeSchema.or("undefined"),
  description: "string?"
}).narrow((setting, problems) => {
  if (!setting.key.trim()) {
    return problems.mustBe("key cannot be empty");
  }
  return true;
});

// ===== MEDIA SCHEMAS =====

// Media upload schema
export const MediaUploadSchema = type({
  fileName: "string",
  fileSize: FileSizeSchema,
  fileType: AllowedMimeTypeSchema
}).narrow((media, problems) => {
  if (!media.fileName.trim()) {
    return problems.mustBe("fileName cannot be empty");
  }
  return true;
});

// Media update schema
export const MediaUpdateSchema = type({
  id: PositiveIntegerSchema,
  title: "string?",
  caption: "string?",
  altText: "string?"
});

// Media query schema
export const MediaQuerySchema = type({
  page: NonNegativeIntegerSchema.or("undefined"),
  limit: NonNegativeIntegerSchema.or("undefined"),
  search: "string?",
  type: "string?"
}).narrow((query, problems) => {
  if (query.page !== undefined && typeof query.page === "number" && query.page < 1) {
    return problems.mustBe("page must be at least 1");
  }
  if (query.limit !== undefined && typeof query.limit === "number" && (query.limit < 1 || query.limit > 100)) {
    return problems.mustBe("limit must be between 1 and 100");
  }
  return true;
});

// ===== SEO SCHEMAS =====

// SEO data schema
export const SEODataSchema = type({
  postId: PositiveIntegerSchema,
  metaTitle: "string?",
  metaDescription: "string?",
  focusKeyword: "string?",
  canonicalUrl: URLSchema.or("undefined"),
  robots: "string?",
  ogTitle: "string?",
  ogDescription: "string?",
  ogImage: URLSchema.or("undefined"),
  twitterTitle: "string?",
  twitterDescription: "string?",
  twitterImage: URLSchema.or("undefined")
});

// ===== CUSTOM FIELD SCHEMAS =====

// Custom field creation schema
export const CustomFieldCreateSchema = type({
  name: "string",
  label: "string",
  type: "'TEXT' | 'TEXTAREA' | 'NUMBER' | 'DATE' | 'SELECT' | 'CHECKBOX' | 'JSON' | 'FILE' | 'FILE_IMAGE' | 'FILE_VIDEO' | 'FILE_AUDIO' | 'FILE_PDF' | 'FILE_WORD' | 'FILE_EXCEL' | 'FILE_PPT' | 'FILE_OTHER' | 'HTML'",
  required: "boolean",
  options: "string?",
  postTypeId: PositiveIntegerSchema.or("undefined")
}).narrow((field, problems) => {
  if (!/^[a-zA-Z0-9_]+$/.test(field.name)) {
    return problems.mustBe("name must contain only letters, numbers, and underscores");
  }
  if (!field.label.trim()) {
    return problems.mustBe("label cannot be empty");
  }
  if (field.type === 'SELECT' && !field.options) {
    return problems.mustBe("SELECT fields must have options defined");
  }
  return true;
});

// Custom field update schema
export const CustomFieldUpdateSchema = type({
  id: PositiveIntegerSchema,
  name: "string?",
  label: "string?",
  type: "'TEXT' | 'TEXTAREA' | 'NUMBER' | 'DATE' | 'SELECT' | 'CHECKBOX' | 'JSON' | 'FILE' | 'FILE_IMAGE' | 'FILE_VIDEO' | 'FILE_AUDIO' | 'FILE_PDF' | 'FILE_WORD' | 'FILE_EXCEL' | 'FILE_PPT' | 'FILE_OTHER' | 'HTML'",
  required: "boolean?",
  options: "string?",
  postTypeId: PositiveIntegerSchema.or("undefined")
});

// ===== POST TYPE SCHEMAS =====

// Post type creation schema
export const PostTypeCreateSchema = type({
  name: "string",
  label: "string",
  description: "string?",
  public: "boolean?",
  supports: "string[]?"
}).narrow((postType, problems) => {
  if (!/^[a-zA-Z0-9_]+$/.test(postType.name)) {
    return problems.mustBe("name must contain only letters, numbers, and underscores");
  }
  if (!postType.label.trim()) {
    return problems.mustBe("label cannot be empty");
  }
  return true;
});

// ===== PLUGIN SCHEMAS =====

// Plugin toggle schema
export const PluginToggleSchema = type({
  pluginName: "string",
  enabled: "boolean"
}).narrow((plugin, problems) => {
  if (!plugin.pluginName.trim()) {
    return problems.mustBe("pluginName cannot be empty");
  }
  return true;
});

// Export types for TypeScript
export type ThemeColors = typeof ThemeColorsSchema.infer;
export type LayoutConfig = typeof LayoutConfigSchema.infer;
export type ThemeConfig = typeof ThemeConfigSchema.infer;
export type ThemeSaveRequest = typeof ThemeSaveRequestSchema.infer;
export type ThemeActivationRequest = typeof ThemeActivationRequestSchema.infer;
export type ThemeDeletionRequest = typeof ThemeDeletionRequestSchema.infer;
export type CustomField = typeof CustomFieldSchema.infer;
export type UserRole = typeof UserRoleSchema.infer;
export type PostStatus = typeof PostStatusSchema.infer;
export type Pagination = typeof PaginationSchema.infer;

// New exports
export type UserRegistration = typeof UserRegistrationSchema.infer;
export type UserRoleUpdate = typeof UserRoleUpdateSchema.infer;
export type UserQuery = typeof UserQuerySchema.infer;
export type PostCreate = typeof PostCreateSchema.infer;
export type PostUpdate = typeof PostUpdateSchema.infer;
export type BulkPostOperation = typeof BulkPostOperationSchema.infer;
export type CategoryCreate = typeof CategoryCreateSchema.infer;
export type CategoryUpdate = typeof CategoryUpdateSchema.infer;
export type TagCreate = typeof TagCreateSchema.infer;
export type TagUpdate = typeof TagUpdateSchema.infer;
export type CommentCreate = typeof CommentCreateSchema.infer;
export type CommentUpdate = typeof CommentUpdateSchema.infer;
export type BulkCommentOperation = typeof BulkCommentOperationSchema.infer;
export type SettingUpdate = typeof SettingUpdateSchema.infer;
export type MediaUpload = typeof MediaUploadSchema.infer;
export type MediaUpdate = typeof MediaUpdateSchema.infer;
export type MediaQuery = typeof MediaQuerySchema.infer;
export type SEOData = typeof SEODataSchema.infer;
export type CustomFieldCreate = typeof CustomFieldCreateSchema.infer;
export type CustomFieldUpdate = typeof CustomFieldUpdateSchema.infer;
export type PostTypeCreate = typeof PostTypeCreateSchema.infer;
export type PluginToggle = typeof PluginToggleSchema.infer;