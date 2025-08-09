import type { BlockContent, BlockAttributes } from "./types";

// ====== OPTIMIZED CONTENT STORAGE ======

/**
 * Optimized content structure that reduces redundancy and improves storage efficiency
 */
export interface OptimizedBlockContent {
    // Core content - avoid storing both text and HTML when HTML can be derived
    content: string; // Primary content (HTML for rich text, plain text for simple text, URL for media, etc.)
    
    // Content type hint for faster parsing
    type?: 'html' | 'text' | 'markdown' | 'url' | 'json';
    
    // Additional structured data only when needed
    metadata?: {
        // Text blocks
        plainText?: string; // Only store when different from extracted text
        
        // Media blocks
        alt?: string;
        caption?: string;
        width?: number;
        height?: number;
        
        // Code blocks
        language?: string;
        showLineNumbers?: boolean;
        
        // Heading blocks
        level?: 1 | 2 | 3 | 4 | 5 | 6;
        
        // List blocks
        listType?: 'ordered' | 'unordered';
        
        // Quote blocks
        citation?: string;
        quoteStyle?: 'default' | 'large' | 'pull';
        
        // Button blocks
        url?: string;
        buttonStyle?: 'primary' | 'secondary' | 'outline';
        size?: 'small' | 'medium' | 'large';
        alignment?: 'left' | 'center' | 'right';
        
        // Custom metadata
        [key: string]: any;
    };
    
    // Formatting only when it differs from defaults
    format?: {
        textAlign?: 'left' | 'center' | 'right' | 'justify';
        color?: string;
        backgroundColor?: string;
        fontSize?: string;
        fontFamily?: string;
        fontWeight?: 'normal' | 'bold';
        fontStyle?: 'normal' | 'italic';
        textDecoration?: 'none' | 'underline' | 'strikethrough';
        lineHeight?: string;
        letterSpacing?: string;
        [key: string]: any; // For custom formatting
    };
}

/**
 * Optimized block attributes that only store non-default values
 */
export interface OptimizedBlockAttributes {
    // Layout and spacing - only store when different from defaults
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
    
    // Styling - only store when applied
    className?: string;
    id?: string;
    backgroundColor?: string;
    textColor?: string;
    width?: string;
    maxWidth?: string;
    anchor?: string;
    
    // Custom attributes
    [key: string]: any;
}

/**
 * Converts legacy block content to optimized format
 */
export function optimizeBlockContent(content: BlockContent): OptimizedBlockContent {
    if (!content) {
        return { content: '' };
    }

    // Handle text-based blocks
    if ('text' in content || 'html' in content) {
        const hasHtml = content.html && content.html !== content.text;
        const primaryContent = hasHtml ? content.html : content.text || '';
        
        const optimized: OptimizedBlockContent = {
            content: primaryContent,
            type: hasHtml ? 'html' : 'text'
        };

        // Only store plain text if it's different from what can be extracted from HTML
        if (hasHtml && content.text && content.text !== extractTextFromHtml(content.html)) {
            optimized.metadata = { plainText: content.text };
        }

        // Add formatting if present and non-default
        if (content.format && hasNonDefaultFormatting(content.format)) {
            optimized.format = cleanFormat(content.format);
        }

        return optimized;
    }

    // Handle image blocks
    if ('url' in content) {
        const optimized: OptimizedBlockContent = {
            content: content.url,
            type: 'url'
        };

        const metadata: any = {};
        if (content.alt) metadata.alt = content.alt;
        if (content.caption) metadata.caption = content.caption;
        if (content.width) metadata.width = content.width;
        if (content.height) metadata.height = content.height;

        if (Object.keys(metadata).length > 0) {
            optimized.metadata = metadata;
        }

        return optimized;
    }

    // Handle code blocks
    if ('code' in content) {
        const optimized: OptimizedBlockContent = {
            content: content.code,
            type: 'text'
        };

        const metadata: any = {};
        if (content.language) metadata.language = content.language;
        if (content.showLineNumbers) metadata.showLineNumbers = content.showLineNumbers;

        if (Object.keys(metadata).length > 0) {
            optimized.metadata = metadata;
        }

        return optimized;
    }

    // Handle heading blocks
    if ('level' in content) {
        const hasHtml = content.html && content.html !== content.text;
        const primaryContent = hasHtml ? content.html : content.text || '';
        
        const optimized: OptimizedBlockContent = {
            content: primaryContent,
            type: hasHtml ? 'html' : 'text',
            metadata: { level: content.level }
        };

        // Add formatting if present
        if (content.format && hasNonDefaultFormatting(content.format)) {
            optimized.format = cleanFormat(content.format);
        }

        return optimized;
    }

    // Handle other block types - convert to JSON for complex structures
    return {
        content: JSON.stringify(content),
        type: 'json'
    };
}

/**
 * Converts optimized content back to legacy format for backward compatibility
 */
export function expandOptimizedContent(optimized: OptimizedBlockContent, blockType: string): BlockContent {
    if (!optimized || !optimized.content) {
        return {};
    }

    switch (optimized.type) {
        case 'html':
            return {
                html: optimized.content,
                text: optimized.metadata?.plainText || extractTextFromHtml(optimized.content),
                format: optimized.format || {}
            };

        case 'text':
            const result: any = {
                text: optimized.content
            };
            
            // Add format if present
            if (optimized.format) {
                result.format = optimized.format;
            }
            
            // Add metadata based on block type
            if (blockType === 'HEADING' && optimized.metadata?.level) {
                result.level = optimized.metadata.level;
            }
            
            if (blockType === 'CODE') {
                result.code = optimized.content;
                if (optimized.metadata?.language) result.language = optimized.metadata.language;
                if (optimized.metadata?.showLineNumbers) result.showLineNumbers = optimized.metadata.showLineNumbers;
            }
            
            return result;

        case 'url':
            const urlResult: any = { url: optimized.content };
            if (optimized.metadata) {
                Object.assign(urlResult, optimized.metadata);
            }
            return urlResult;

        case 'json':
            try {
                return JSON.parse(optimized.content);
            } catch {
                return { text: optimized.content };
            }

        default:
            return { text: optimized.content };
    }
}

/**
 * Extracts plain text from HTML content
 */
function extractTextFromHtml(html: string): string {
    if (typeof document !== 'undefined') {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        return tempDiv.textContent || tempDiv.innerText || '';
    }
    // Fallback for server-side
    return html.replace(/<[^>]*>/g, '');
}

/**
 * Checks if formatting contains non-default values
 */
function hasNonDefaultFormatting(format: any): boolean {
    if (!format || typeof format !== 'object') return false;
    
    const defaultValues = {
        textAlign: 'left',
        color: '',
        backgroundColor: '',
        fontSize: '',
        fontFamily: '',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none'
    };

    return Object.keys(format).some(key => {
        const value = format[key];
        const defaultValue = defaultValues[key as keyof typeof defaultValues];
        return value && value !== defaultValue;
    });
}

/**
 * Removes default formatting values to reduce storage
 */
function cleanFormat(format: any): any {
    if (!format || typeof format !== 'object') return {};
    
    const cleaned: any = {};
    const defaultValues = {
        textAlign: 'left',
        color: '',
        backgroundColor: '',
        fontSize: '',
        fontFamily: '',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none'
    };

    Object.keys(format).forEach(key => {
        const value = format[key];
        const defaultValue = defaultValues[key as keyof typeof defaultValues];
        if (value && value !== defaultValue) {
            cleaned[key] = value;
        }
    });

    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

/**
 * Optimizes block attributes by removing default values
 */
export function optimizeBlockAttributes(attributes: BlockAttributes): OptimizedBlockAttributes {
    if (!attributes) return {};
    
    const optimized: OptimizedBlockAttributes = {};
    
    // Only include non-empty/non-default values
    Object.keys(attributes).forEach(key => {
        const value = attributes[key];
        if (value !== undefined && value !== null && value !== '') {
            optimized[key] = value;
        }
    });
    
    return optimized;
}

/**
 * Content compression utilities for large content
 */
export const ContentCompression = {
    /**
     * Compress large HTML content using simple techniques
     */
    compressHtml(html: string): string {
        if (html.length < 1000) return html; // Don't compress small content
        
        return html
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/>\s+</g, '><') // Remove whitespace between tags
            .trim();
    },
    
    /**
     * Estimate storage size reduction
     */
    estimateReduction(original: BlockContent, optimized: OptimizedBlockContent): number {
        const originalSize = JSON.stringify(original).length;
        const optimizedSize = JSON.stringify(optimized).length;
        return Math.round(((originalSize - optimizedSize) / originalSize) * 100);
    }
};