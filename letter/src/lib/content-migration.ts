import { db } from './db';
import { optimizeBlockContent, optimizeBlockAttributes, expandOptimizedContent, type OptimizedBlockContent, type OptimizedBlockAttributes } from './content-optimization';
import type { BlockContent, BlockAttributes } from './types';

/**
 * Migration utilities for transitioning to optimized content storage
 */

export interface ContentMigrationStats {
    totalBlocks: number;
    migratedBlocks: number;
    storageReduction: number; // Percentage
    errors: Array<{ blockId: number; error: string }>;
}

/**
 * Migrates all content blocks to use optimized storage format
 */
export async function migrateContentToOptimized(): Promise<ContentMigrationStats> {
    const stats: ContentMigrationStats = {
        totalBlocks: 0,
        migratedBlocks: 0,
        storageReduction: 0,
        errors: []
    };

    try {
        // Get all content blocks
        const blocks = await db.contentBlock.findMany({
            select: {
                id: true,
                blockType: true,
                content: true,
                attributes: true
            }
        });

        stats.totalBlocks = blocks.length;
        let totalOriginalSize = 0;
        let totalOptimizedSize = 0;

        for (const block of blocks) {
            try {
                const originalContent = block.content as any;
                const originalAttributes = block.attributes as any;
                
                // Calculate original size
                const originalSize = JSON.stringify({
                    content: originalContent,
                    attributes: originalAttributes
                }).length;
                
                // Optimize content and attributes
                const optimizedContent = optimizeBlockContent(originalContent);
                const optimizedAttributes = optimizeBlockAttributes(originalAttributes);
                
                // Calculate optimized size
                const optimizedSize = JSON.stringify({
                    content: optimizedContent,
                    attributes: optimizedAttributes
                }).length;
                
                // Update block with optimized data
                await db.contentBlock.update({
                    where: { id: block.id },
                    data: {
                        content: optimizedContent as any,
                        attributes: optimizedAttributes as any
                    }
                });
                
                totalOriginalSize += originalSize;
                totalOptimizedSize += optimizedSize;
                stats.migratedBlocks++;
                
            } catch (error) {
                stats.errors.push({
                    blockId: block.id,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        
        // Calculate storage reduction
        if (totalOriginalSize > 0) {
            stats.storageReduction = Math.round(
                ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100
            );
        }
        
    } catch (error) {
        throw new Error(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return stats;
}

/**
 * Reverts optimized content back to legacy format
 */
export async function revertContentToLegacy(): Promise<ContentMigrationStats> {
    const stats: ContentMigrationStats = {
        totalBlocks: 0,
        migratedBlocks: 0,
        storageReduction: 0, // Will be negative (increase)
        errors: []
    };

    try {
        // Get all content blocks
        const blocks = await db.contentBlock.findMany({
            select: {
                id: true,
                blockType: true,
                content: true,
                attributes: true
            }
        });

        stats.totalBlocks = blocks.length;

        for (const block of blocks) {
            try {
                const optimizedContent = block.content as unknown as OptimizedBlockContent;
                const optimizedAttributes = block.attributes as OptimizedBlockAttributes;
                
                // Expand back to legacy format
                const legacyContent = expandOptimizedContent(optimizedContent, block.blockType);
                const legacyAttributes = optimizedAttributes; // Attributes are backward compatible
                
                // Update block with legacy data
                await db.contentBlock.update({
                    where: { id: block.id },
                    data: {
                        content: legacyContent as any,
                        attributes: legacyAttributes as any
                    }
                });
                
                stats.migratedBlocks++;
                
            } catch (error) {
                stats.errors.push({
                    blockId: block.id,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        
    } catch (error) {
        throw new Error(`Reversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return stats;
}

/**
 * Analyzes content structure without making changes
 */
export async function analyzeContentStructure(): Promise<{
    totalBlocks: number;
    blockTypes: Record<string, number>;
    averageContentSize: number;
    largestBlocks: Array<{ id: number; size: number; type: string }>;
    potentialSavings: number;
}> {
    const blocks = await db.contentBlock.findMany({
        select: {
            id: true,
            blockType: true,
            content: true,
            attributes: true
        }
    });

    const analysis = {
        totalBlocks: blocks.length,
        blockTypes: {} as Record<string, number>,
        averageContentSize: 0,
        largestBlocks: [] as Array<{ id: number; size: number; type: string }>,
        potentialSavings: 0
    };

    let totalSize = 0;
    let totalOptimizedSize = 0;
    const blockSizes: Array<{ id: number; size: number; type: string }> = [];

    for (const block of blocks) {
        // Count block types
        analysis.blockTypes[block.blockType] = (analysis.blockTypes[block.blockType] || 0) + 1;
        
        // Calculate sizes
        const currentSize = JSON.stringify({ 
            content: block.content, 
            attributes: block.attributes 
        }).length;
        
        const optimizedContent = optimizeBlockContent(block.content as any);
        const optimizedAttributes = optimizeBlockAttributes(block.attributes as any);
        const optimizedSize = JSON.stringify({
            content: optimizedContent,
            attributes: optimizedAttributes
        }).length;
        
        totalSize += currentSize;
        totalOptimizedSize += optimizedSize;
        
        blockSizes.push({
            id: block.id,
            size: currentSize,
            type: block.blockType
        });
    }

    // Calculate averages and find largest blocks
    analysis.averageContentSize = Math.round(totalSize / blocks.length);
    analysis.largestBlocks = blockSizes
        .sort((a, b) => b.size - a.size)
        .slice(0, 10);
    
    // Calculate potential savings
    if (totalSize > 0) {
        analysis.potentialSavings = Math.round(
            ((totalSize - totalOptimizedSize) / totalSize) * 100
        );
    }

    return analysis;
}

/**
 * Content adapter for backward compatibility
 * Automatically handles both optimized and legacy content formats
 */
export class ContentAdapter {
    /**
     * Reads content and ensures it's in legacy format for existing code
     */
    static toLegacyFormat(content: any, blockType: string): BlockContent {
        if (!content) return {};
        
        // Check if content is already in optimized format
        if (content.content !== undefined && content.type !== undefined) {
            return expandOptimizedContent(content as OptimizedBlockContent, blockType);
        }
        
        // Already in legacy format
        return content as BlockContent;
    }
    
    /**
     * Converts content to optimized format for storage
     */
    static toOptimizedFormat(content: BlockContent): OptimizedBlockContent {
        return optimizeBlockContent(content);
    }
    
    /**
     * Determines if content is in optimized format
     */
    static isOptimized(content: any): boolean {
        return content && 
               typeof content === 'object' && 
               'content' in content && 
               'type' in content;
    }
}