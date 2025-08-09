// Block Pattern System Types
import type { BlockContent } from "./types";

export interface BlockPattern {
    name: string;
    title: string;
    description: string;
    icon: string;
    category: 'text' | 'media' | 'layout' | 'header' | 'call-to-action' | 'testimonial' | 'hero' | 'custom';
    keywords?: string[];
    blocks: PatternBlock[];
    preview?: string; // Base64 image or URL
}

export interface PatternBlock {
    type: string;
    content: BlockContent;
    attributes?: Record<string, any>;
}

export interface PatternRegistry {
    [patternName: string]: BlockPattern;
}

export interface PatternCategory {
    name: string;
    title: string;
    description: string;
    icon: string;
}