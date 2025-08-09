import { For, Show, createMemo, type JSX } from "solid-js";

interface SEOAnalysis {
    score: number;
    checks: SEOCheck[];
}

interface SEOCheck {
    name: string;
    status: 'pass' | 'warning' | 'fail';
    message: string;
    suggestion?: string;
}

interface SEOAnalyzerProps {
    title: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
    slug?: string;
    focusKeyword?: string;
}

export function SEOAnalyzer(props: SEOAnalyzerProps): JSX.Element {
    const analysis = createMemo((): SEOAnalysis => {
        const checks: SEOCheck[] = [];
        let score = 0;
        const maxScore = 100;

        // Content length check
        const contentWordCount = props.content.split(/\s+/).filter(word => word.length > 0).length;
        if (contentWordCount >= 300) {
            checks.push({
                name: 'Content Length',
                status: 'pass',
                message: `Good content length (${contentWordCount} words)`
            });
            score += 15;
        } else if (contentWordCount >= 150) {
            checks.push({
                name: 'Content Length',
                status: 'warning',
                message: `Content could be longer (${contentWordCount} words)`,
                suggestion: 'Aim for at least 300 words for better SEO'
            });
            score += 8;
        } else {
            checks.push({
                name: 'Content Length',
                status: 'fail',
                message: `Content too short (${contentWordCount} words)`,
                suggestion: 'Write at least 300 words for better search rankings'
            });
        }

        // Meta title check
        const titleLength = props.metaTitle?.length || 0;
        if (titleLength >= 30 && titleLength <= 60) {
            checks.push({
                name: 'Meta Title Length',
                status: 'pass',
                message: `Perfect title length (${titleLength} characters)`
            });
            score += 15;
        } else if (titleLength > 0) {
            checks.push({
                name: 'Meta Title Length',
                status: 'warning',
                message: `Title length could be improved (${titleLength} characters)`,
                suggestion: 'Keep meta titles between 30-60 characters'
            });
            score += 8;
        } else {
            checks.push({
                name: 'Meta Title',
                status: 'fail',
                message: 'No meta title set',
                suggestion: 'Add a compelling meta title for search results'
            });
        }

        // Meta description check
        const descLength = props.metaDescription?.length || 0;
        if (descLength >= 120 && descLength <= 160) {
            checks.push({
                name: 'Meta Description Length',
                status: 'pass',
                message: `Perfect description length (${descLength} characters)`
            });
            score += 15;
        } else if (descLength > 0) {
            checks.push({
                name: 'Meta Description Length',
                status: 'warning',
                message: `Description length could be improved (${descLength} characters)`,
                suggestion: 'Keep meta descriptions between 120-160 characters'
            });
            score += 8;
        } else {
            checks.push({
                name: 'Meta Description',
                status: 'fail',
                message: 'No meta description set',
                suggestion: 'Add a compelling meta description for search results'
            });
        }

        // URL slug check
        if (props.slug) {
            const slugLength = props.slug.length;
            const hasSpaces = props.slug.includes(' ');
            const hasSpecialChars = /[^a-z0-9-]/.test(props.slug);
            
            if (!hasSpaces && !hasSpecialChars && slugLength <= 75) {
                checks.push({
                    name: 'URL Slug',
                    status: 'pass',
                    message: 'SEO-friendly URL structure'
                });
                score += 10;
            } else {
                checks.push({
                    name: 'URL Slug',
                    status: 'warning',
                    message: 'URL could be more SEO-friendly',
                    suggestion: 'Use lowercase letters, numbers, and hyphens only. Keep it under 75 characters.'
                });
                score += 5;
            }
        } else {
            checks.push({
                name: 'URL Slug',
                status: 'fail',
                message: 'No URL slug set',
                suggestion: 'Create a descriptive, SEO-friendly URL slug'
            });
        }

        // Focus keyword checks (if provided)
        if (props.focusKeyword) {
            const keyword = props.focusKeyword.toLowerCase();
            const titleText = (props.metaTitle || props.title).toLowerCase();
            const contentText = props.content.toLowerCase();
            const descText = (props.metaDescription || '').toLowerCase();

            // Keyword in title
            if (titleText.includes(keyword)) {
                checks.push({
                    name: 'Keyword in Title',
                    status: 'pass',
                    message: 'Focus keyword appears in title'
                });
                score += 10;
            } else {
                checks.push({
                    name: 'Keyword in Title',
                    status: 'fail',
                    message: 'Focus keyword not found in title',
                    suggestion: 'Include your focus keyword in the title'
                });
            }

            // Keyword in meta description
            if (descText.includes(keyword)) {
                checks.push({
                    name: 'Keyword in Description',
                    status: 'pass',
                    message: 'Focus keyword appears in meta description'
                });
                score += 10;
            } else {
                checks.push({
                    name: 'Keyword in Description',
                    status: 'warning',
                    message: 'Focus keyword not found in meta description',
                    suggestion: 'Consider including your focus keyword in the meta description'
                });
                score += 5;
            }

            // Keyword density in content
            const keywordCount = (contentText.match(new RegExp(keyword, 'g')) || []).length;
            const density = contentWordCount > 0 ? (keywordCount / contentWordCount) * 100 : 0;
            
            if (density >= 0.5 && density <= 2.5) {
                checks.push({
                    name: 'Keyword Density',
                    status: 'pass',
                    message: `Good keyword density (${density.toFixed(1)}%)`
                });
                score += 10;
            } else if (density > 2.5) {
                checks.push({
                    name: 'Keyword Density',
                    status: 'warning',
                    message: `Keyword density too high (${density.toFixed(1)}%)`,
                    suggestion: 'Reduce keyword usage to avoid over-optimization'
                });
                score += 5;
            } else {
                checks.push({
                    name: 'Keyword Density',
                    status: 'warning',
                    message: `Low keyword density (${density.toFixed(1)}%)`,
                    suggestion: 'Consider including your focus keyword more naturally in the content'
                });
                score += 3;
            }
        }

        // Heading structure check
        const headingMatches = props.content.match(/<h[1-6][^>]*>/gi) || [];
        if (headingMatches.length >= 2) {
            checks.push({
                name: 'Heading Structure',
                status: 'pass',
                message: `Good heading structure (${headingMatches.length} headings found)`
            });
            score += 10;
        } else if (headingMatches.length === 1) {
            checks.push({
                name: 'Heading Structure',
                status: 'warning',
                message: 'Could use more headings for better structure',
                suggestion: 'Add more headings (H2, H3) to break up your content'
            });
            score += 5;
        } else {
            checks.push({
                name: 'Heading Structure',
                status: 'fail',
                message: 'No headings found in content',
                suggestion: 'Add headings to structure your content better'
            });
        }

        // Images with alt text check
        const imageMatches = props.content.match(/<img[^>]*>/gi) || [];
        const imagesWithAlt = props.content.match(/<img[^>]*alt=["'][^"']*["'][^>]*>/gi) || [];
        
        if (imageMatches.length === 0) {
            checks.push({
                name: 'Images',
                status: 'warning',
                message: 'No images found',
                suggestion: 'Consider adding relevant images to enhance your content'
            });
            score += 5;
        } else if (imagesWithAlt.length === imageMatches.length) {
            checks.push({
                name: 'Image Alt Text',
                status: 'pass',
                message: `All ${imageMatches.length} images have alt text`
            });
            score += 10;
        } else {
            checks.push({
                name: 'Image Alt Text',
                status: 'warning',
                message: `${imagesWithAlt.length}/${imageMatches.length} images have alt text`,
                suggestion: 'Add descriptive alt text to all images'
            });
            score += 5;
        }

        return {
            score: Math.round((score / maxScore) * 100),
            checks
        };
    });

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 80) return 'bg-green-100 border-green-200';
        if (score >= 60) return 'bg-yellow-100 border-yellow-200';
        return 'bg-red-100 border-red-200';
    };

    const getStatusIcon = (status: 'pass' | 'warning' | 'fail') => {
        switch (status) {
            case 'pass': return '✅';
            case 'warning': return '⚠️';
            case 'fail': return '❌';
        }
    };

    const getStatusColor = (status: 'pass' | 'warning' | 'fail') => {
        switch (status) {
            case 'pass': return 'text-green-700';
            case 'warning': return 'text-yellow-700';
            case 'fail': return 'text-red-700';
        }
    };

    return (
        <div class="seo-analyzer bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900">SEO Analysis</h3>
                <div class={`px-3 py-1 rounded-full border ${getScoreBgColor(analysis().score)}`}>
                    <span class={`font-semibold ${getScoreColor(analysis().score)}`}>
                        {analysis().score}/100
                    </span>
                </div>
            </div>

            {/* Score Overview */}
            <div class="mb-6">
                <div class="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>SEO Score</span>
                    <span>{analysis().score}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                    <div 
                        class={`h-3 rounded-full transition-all ${
                            analysis().score >= 80 ? 'bg-green-400' :
                            analysis().score >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${analysis().score}%` }}
                    />
                </div>
                <p class="text-xs text-gray-500 mt-1">
                    {analysis().score >= 80 ? 'Excellent SEO optimization!' :
                     analysis().score >= 60 ? 'Good SEO, but room for improvement' :
                     'Needs significant SEO improvements'}
                </p>
            </div>

            {/* Detailed Checks */}
            <div class="space-y-3">
                <h4 class="font-medium text-gray-900 text-sm">Detailed Analysis</h4>
                <For each={analysis().checks}>
                    {(check) => (
                        <div class="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                            <span class="text-lg">{getStatusIcon(check.status)}</span>
                            <div class="flex-1">
                                <div class="flex items-center justify-between">
                                    <h5 class="font-medium text-gray-900 text-sm">{check.name}</h5>
                                    <span class={`text-xs font-medium ${getStatusColor(check.status)}`}>
                                        {check.status.toUpperCase()}
                                    </span>
                                </div>
                                <p class="text-sm text-gray-600 mt-1">{check.message}</p>
                                <Show when={check.suggestion}>
                                    <p class="text-xs text-blue-600 mt-1">💡 {check.suggestion}</p>
                                </Show>
                            </div>
                        </div>
                    )}
                </For>
            </div>

            {/* Quick Actions */}
            <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 class="font-medium text-blue-900 text-sm mb-2">Quick SEO Actions</h4>
                <ul class="text-xs text-blue-800 space-y-1">
                    <li>• Research keywords for your topic using tools like Google Keyword Planner</li>
                    <li>• Write naturally and focus on providing value to your readers</li>
                    <li>• Use internal links to connect related content on your site</li>
                    <li>• Optimize images by compressing them and using descriptive filenames</li>
                    <li>• Share your content on social media to increase visibility</li>
                </ul>
            </div>
        </div>
    );
}