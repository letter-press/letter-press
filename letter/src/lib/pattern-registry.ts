import type { BlockPattern, PatternRegistry, PatternCategory } from "./pattern-types";

// Default pattern categories
export const defaultPatternCategories: PatternCategory[] = [
    {
        name: 'text',
        title: 'Text',
        description: 'Text-focused patterns for content creation',
        icon: '📝'
    },
    {
        name: 'media',
        title: 'Media',
        description: 'Image and video focused layouts',
        icon: '🖼️'
    },
    {
        name: 'layout',
        title: 'Layout',
        description: 'Structural patterns for page organization',
        icon: '📊'
    },
    {
        name: 'header',
        title: 'Headers',
        description: 'Page and section headers',
        icon: '📄'
    },
    {
        name: 'call-to-action',
        title: 'Call to Action',
        description: 'Conversion-focused patterns',
        icon: '🎯'
    },
    {
        name: 'testimonial',
        title: 'Testimonials',
        description: 'Social proof and testimonial layouts',
        icon: '💬'
    },
    {
        name: 'hero',
        title: 'Hero Sections',
        description: 'Landing page hero sections',
        icon: '🦸'
    }
];

// Default block patterns
export const defaultBlockPatterns: PatternRegistry = {
    'hero-with-image': {
        name: 'hero-with-image',
        title: 'Hero with Image',
        description: 'A hero section with heading, description, button, and background image',
        icon: '🦸',
        category: 'hero',
        keywords: ['hero', 'landing', 'banner', 'header'],
        blocks: [
            {
                type: 'GROUP',
                content: {},
                attributes: {
                    className: 'hero-section',
                    style: {
                        padding: '80px 20px',
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        minHeight: '500px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }
                }
            },
            {
                type: 'HEADING',
                content: {
                    text: 'Welcome to Your Amazing Website',
                    level: 1,
                    format: {
                        textAlign: 'center',
                        color: 'white'
                    }
                }
            },
            {
                type: 'PARAGRAPH',
                content: {
                    text: 'Create something amazing with our powerful tools and beautiful designs.',
                    format: {
                        textAlign: 'center',
                        fontSize: '1.2em'
                    }
                }
            },
            {
                type: 'BUTTON',
                content: {
                    text: 'Get Started',
                    url: '#',
                    style: 'primary',
                    size: 'large',
                    alignment: 'center'
                }
            }
        ]
    },

    'two-column-text': {
        name: 'two-column-text',
        title: 'Two Column Text',
        description: 'Text content split into two equal columns',
        icon: '📊',
        category: 'layout',
        keywords: ['columns', 'layout', 'text'],
        blocks: [
            {
                type: 'COLUMNS',
                content: {
                    columns: 2,
                    gap: 'large'
                }
            },
            {
                type: 'PARAGRAPH',
                content: {
                    text: 'This is the first column of content. You can add any text, images, or other blocks here to create a rich layout.'
                }
            },
            {
                type: 'PARAGRAPH',
                content: {
                    text: 'This is the second column of content. Two-column layouts are great for comparing content or creating visual balance on your page.'
                }
            }
        ]
    },

    'testimonial-card': {
        name: 'testimonial-card',
        title: 'Testimonial Card',
        description: 'A testimonial with quote, author name, and title',
        icon: '💬',
        category: 'testimonial',
        keywords: ['testimonial', 'quote', 'review'],
        blocks: [
            {
                type: 'GROUP',
                content: {},
                attributes: {
                    className: 'testimonial-card',
                    style: {
                        padding: '30px',
                        border: '1px solid #e1e5e9',
                        borderRadius: '8px',
                        backgroundColor: '#f8f9fa',
                        textAlign: 'center'
                    }
                }
            },
            {
                type: 'QUOTE',
                content: {
                    text: 'This product has completely transformed how we work. The team is more productive and our clients are happier than ever.',
                    citation: '',
                    format: {
                        style: 'large'
                    }
                }
            },
            {
                type: 'PARAGRAPH',
                content: {
                    text: '<strong>Sarah Johnson</strong><br>CEO, TechCorp',
                    format: {
                        textAlign: 'center'
                    }
                }
            }
        ]
    },

    'call-to-action': {
        name: 'call-to-action',
        title: 'Call to Action',
        description: 'A centered call-to-action section with heading, text, and button',
        icon: '🎯',
        category: 'call-to-action',
        keywords: ['cta', 'action', 'conversion', 'button'],
        blocks: [
            {
                type: 'GROUP',
                content: {},
                attributes: {
                    className: 'cta-section',
                    style: {
                        padding: '60px 20px',
                        textAlign: 'center',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        borderRadius: '12px'
                    }
                }
            },
            {
                type: 'HEADING',
                content: {
                    text: 'Ready to Get Started?',
                    level: 2,
                    format: {
                        textAlign: 'center',
                        color: 'white'
                    }
                }
            },
            {
                type: 'PARAGRAPH',
                content: {
                    text: 'Join thousands of satisfied customers and start your journey today.',
                    format: {
                        textAlign: 'center',
                        fontSize: '1.1em'
                    }
                }
            },
            {
                type: 'BUTTON',
                content: {
                    text: 'Start Free Trial',
                    url: '#',
                    style: 'secondary',
                    size: 'large',
                    alignment: 'center'
                }
            }
        ]
    },

    'feature-list': {
        name: 'feature-list',
        title: 'Feature List',
        description: 'A list of features with icons and descriptions',
        icon: '✨',
        category: 'text',
        keywords: ['features', 'list', 'benefits'],
        blocks: [
            {
                type: 'HEADING',
                content: {
                    text: 'Key Features',
                    level: 2,
                    format: {
                        textAlign: 'center'
                    }
                }
            },
            {
                type: 'COLUMNS',
                content: {
                    columns: 2,
                    gap: 'medium'
                }
            },
            {
                type: 'PARAGRAPH',
                content: {
                    text: '🚀 <strong>Fast Performance</strong><br>Lightning-fast loading times and optimized performance'
                }
            },
            {
                type: 'PARAGRAPH',
                content: {
                    text: '🔒 <strong>Secure & Reliable</strong><br>Enterprise-grade security with 99.9% uptime guarantee'
                }
            },
            {
                type: 'PARAGRAPH',
                content: {
                    text: '🎨 <strong>Beautiful Design</strong><br>Professionally designed templates and components'
                }
            },
            {
                type: 'PARAGRAPH',
                content: {
                    text: '📱 <strong>Mobile Optimized</strong><br>Responsive design that works perfectly on all devices'
                }
            }
        ]
    },

    'article-header': {
        name: 'article-header',
        title: 'Article Header',
        description: 'Article title, subtitle, and featured image',
        icon: '📄',
        category: 'header',
        keywords: ['article', 'header', 'title', 'blog'],
        blocks: [
            {
                type: 'HEADING',
                content: {
                    text: 'Your Article Title Goes Here',
                    level: 1,
                    format: {
                        textAlign: 'center'
                    }
                }
            },
            {
                type: 'PARAGRAPH',
                content: {
                    text: 'A compelling subtitle that draws readers in and explains what this article is about.',
                    format: {
                        textAlign: 'center',
                        fontSize: '1.2em',
                        color: '#6b7280'
                    }
                }
            },
            {
                type: 'IMAGE',
                content: {
                    url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800',
                    alt: 'Featured image',
                    caption: 'Photo by Unsplash'
                }
            },
            {
                type: 'SEPARATOR',
                content: {}
            }
        ]
    },

    'three-column-features': {
        name: 'three-column-features',
        title: 'Three Column Features',
        description: 'Three equal columns showcasing key features or services',
        icon: '🏛️',
        category: 'layout',
        keywords: ['features', 'services', 'columns', 'grid'],
        blocks: [
            {
                type: 'HEADING',
                content: {
                    text: 'Why Choose Us?',
                    level: 2,
                    format: {
                        textAlign: 'center'
                    }
                }
            },
            {
                type: 'COLUMNS',
                content: {
                    columns: 3,
                    gap: 'large'
                }
            },
            {
                type: 'GROUP',
                content: {},
                attributes: {
                    className: 'feature-column',
                    style: {
                        textAlign: 'center',
                        padding: '20px'
                    }
                }
            },
            {
                type: 'PARAGRAPH',
                content: {
                    text: '⚡',
                    format: {
                        textAlign: 'center',
                        fontSize: '3em'
                    }
                }
            },
            {
                type: 'HEADING',
                content: {
                    text: 'Lightning Fast',
                    level: 3,
                    format: {
                        textAlign: 'center'
                    }
                }
            },
            {
                type: 'PARAGRAPH',
                content: {
                    text: 'Optimized for performance with sub-second load times.'
                }
            },
            {
                type: 'GROUP',
                content: {},
                attributes: {
                    className: 'feature-column',
                    style: {
                        textAlign: 'center',
                        padding: '20px'
                    }
                }
            },
            {
                type: 'PARAGRAPH',
                content: {
                    text: '🔒',
                    format: {
                        textAlign: 'center',
                        fontSize: '3em'
                    }
                }
            },
            {
                type: 'HEADING',
                content: {
                    text: 'Secure by Design',
                    level: 3,
                    format: {
                        textAlign: 'center'
                    }
                }
            },
            {
                type: 'PARAGRAPH',
                content: {
                    text: 'Enterprise-grade security with end-to-end encryption.'
                }
            },
            {
                type: 'GROUP',
                content: {},
                attributes: {
                    className: 'feature-column',
                    style: {
                        textAlign: 'center',
                        padding: '20px'
                    }
                }
            },
            {
                type: 'PARAGRAPH',
                content: {
                    text: '🎨',
                    format: {
                        textAlign: 'center',
                        fontSize: '3em'
                    }
                }
            },
            {
                type: 'HEADING',
                content: {
                    text: 'Beautiful Design',
                    level: 3,
                    format: {
                        textAlign: 'center'
                    }
                }
            },
            {
                type: 'PARAGRAPH',
                content: {
                    text: 'Carefully crafted interfaces that users love to interact with.'
                }
            }
        ]
    },

    'pricing-table': {
        name: 'pricing-table',
        title: 'Pricing Table',
        description: 'A clean pricing table with three tiers',
        icon: '💰',
        category: 'call-to-action',
        keywords: ['pricing', 'plans', 'subscription', 'comparison'],
        blocks: [
            {
                type: 'HEADING',
                content: {
                    text: 'Choose Your Plan',
                    level: 2,
                    format: {
                        textAlign: 'center'
                    }
                }
            },
            {
                type: 'PARAGRAPH',
                content: {
                    text: 'Select the perfect plan for your needs. Upgrade or downgrade at any time.',
                    format: {
                        textAlign: 'center',
                        color: '#6b7280'
                    }
                }
            },
            {
                type: 'COLUMNS',
                content: {
                    columns: 3,
                    gap: 'medium'
                }
            },
            {
                type: 'GROUP',
                content: {},
                attributes: {
                    className: 'pricing-card',
                    style: {
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '30px 20px',
                        textAlign: 'center'
                    }
                }
            },
            {
                type: 'HEADING',
                content: {
                    text: 'Starter',
                    level: 3
                }
            },
            {
                type: 'PARAGRAPH',
                content: {
                    text: '<span style="font-size: 2em; font-weight: bold;">$9</span><span style="color: #6b7280;">/month</span>'
                }
            },
            {
                type: 'LIST',
                content: {
                    items: ['Up to 5 projects', '10GB storage', 'Email support']
                }
            },
            {
                type: 'BUTTON',
                content: {
                    text: 'Get Started',
                    style: 'secondary'
                }
            }
        ]
    }
};

// Pattern management functions
const customPatterns = new Map<string, BlockPattern>();

export function registerPattern(pattern: BlockPattern): void {
    if (defaultBlockPatterns[pattern.name] || customPatterns.has(pattern.name)) {
        console.warn(`Pattern '${pattern.name}' is already registered`);
        return;
    }
    
    customPatterns.set(pattern.name, pattern);
}

export function unregisterPattern(patternName: string): void {
    customPatterns.delete(patternName);
}

export function getPatternRegistry(): PatternRegistry {
    const registry = { ...defaultBlockPatterns };
    
    // Add custom patterns
    customPatterns.forEach((pattern, patternName) => {
        registry[patternName] = pattern;
    });
    
    return registry;
}

export function getPattern(patternName: string): BlockPattern | undefined {
    return defaultBlockPatterns[patternName] || customPatterns.get(patternName);
}

export function getPatternsByCategory(category: string): BlockPattern[] {
    const registry = getPatternRegistry();
    return Object.values(registry).filter(pattern => pattern.category === category);
}

export function getAllPatternCategories(): PatternCategory[] {
    return defaultPatternCategories;
}

export function searchPatterns(query: string): BlockPattern[] {
    const registry = getPatternRegistry();
    const lowercaseQuery = query.toLowerCase();
    
    return Object.values(registry).filter(pattern => {
        const searchText = [
            pattern.title,
            pattern.description,
            ...(pattern.keywords || [])
        ].join(' ').toLowerCase();
        
        return searchText.includes(lowercaseQuery);
    });
}