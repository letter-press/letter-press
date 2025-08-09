import { For, Show, type JSX } from "solid-js";
import type { ContentBlockWithChildren } from "~/lib/types";

interface BlockRendererProps {
  blocks: ContentBlockWithChildren[];
  className?: string;
}

interface BlockProps {
  block: ContentBlockWithChildren;
}

export function BlockRenderer(props: BlockRendererProps): JSX.Element {
  return (
    <div class={`block-content ${props.className || ''}`}>
      <For each={props.blocks}>
        {(block) => <RenderBlock block={block} />}
      </For>
    </div>
  );
}

function RenderBlock(props: BlockProps): JSX.Element {
  const { block } = props;

  switch (block.blockType) {
    case 'PARAGRAPH':
      return <RenderParagraph block={block} />;
    case 'HEADING':
      return <RenderHeading block={block} />;
    case 'RICH_TEXT':
      return <RenderRichText block={block} />;
    case 'IMAGE':
      return <RenderImage block={block} />;
    case 'QUOTE':
      return <RenderQuote block={block} />;
    case 'CODE':
      return <RenderCode block={block} />;
    case 'LIST':
      return <RenderList block={block} />;
    case 'SEPARATOR':
      return <RenderSeparator block={block} />;
    case 'SPACER':
      return <RenderSpacer block={block} />;
    default:
      return <RenderUnknown block={block} />;
  }
}

function RenderParagraph(props: BlockProps): JSX.Element {
  const content = props.block.content as any;
  const html = content?.html || '';
  const text = content?.text || '';
  
  if (html) {
    return <p class="mb-4 leading-relaxed" innerHTML={html} />;
  }
  
  return <p class="mb-4 leading-relaxed">{text}</p>;
}

function RenderHeading(props: BlockProps): JSX.Element {
  const content = props.block.content as any;
  const html = content?.html || '';
  const text = content?.text || '';
  const level = content?.level || 2;
  
  const headingClasses = {
    1: "text-4xl font-bold text-gray-900 mb-6 mt-8",
    2: "text-3xl font-semibold text-gray-900 mb-5 mt-7",
    3: "text-2xl font-medium text-gray-900 mb-4 mt-6",
    4: "text-xl font-medium text-gray-900 mb-3 mt-5",
    5: "text-lg font-medium text-gray-900 mb-2 mt-4",
    6: "text-base font-medium text-gray-900 mb-2 mt-3"
  };
  
  const className = headingClasses[level as keyof typeof headingClasses] || headingClasses[2];
  
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  
  if (html) {
    return <HeadingTag class={className} innerHTML={html} />;
  }
  
  return <HeadingTag class={className}>{text}</HeadingTag>;
}

function RenderRichText(props: BlockProps): JSX.Element {
  const content = props.block.content as any;
  const html = content?.html || '';
  const text = content?.text || '';
  
  if (html) {
    return (
      <div 
        class="rich-text-content mb-6 leading-relaxed prose prose-lg max-w-none" 
        innerHTML={html} 
      />
    );
  }
  
  return <div class="rich-text-content mb-6 leading-relaxed">{text}</div>;
}

function RenderImage(props: BlockProps): JSX.Element {
  const content = props.block.content as any;
  const url = content?.url || '';
  const alt = content?.alt || '';
  const caption = content?.caption || '';
  
  if (!url) return <div />;
  
  return (
    <figure class="mb-8">
      <img 
        src={url} 
        alt={alt} 
        class="w-full h-auto rounded-lg shadow-sm" 
        loading="lazy"
      />
      <Show when={caption}>
        <figcaption class="text-sm text-gray-600 text-center mt-2 italic">
          {caption}
        </figcaption>
      </Show>
    </figure>
  );
}

function RenderQuote(props: BlockProps): JSX.Element {
  const content = props.block.content as any;
  const text = content?.text || '';
  const citation = content?.citation || '';
  
  return (
    <blockquote class="border-l-4 border-blue-500 pl-6 py-4 mb-6 italic text-lg text-gray-700 bg-blue-50/50 rounded-r-lg">
      <p class="mb-2">{text}</p>
      <Show when={citation}>
        <cite class="text-sm text-gray-600 not-italic">— {citation}</cite>
      </Show>
    </blockquote>
  );
}

function RenderCode(props: BlockProps): JSX.Element {
  const content = props.block.content as any;
  const code = content?.code || '';
  const language = content?.language || 'text';
  
  return (
    <div class="mb-6">
      <pre class="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code class={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
}

function RenderList(props: BlockProps): JSX.Element {
  const content = props.block.content as any;
  const type = content?.type || 'unordered';
  const items = content?.items || [];
  
  const ListTag = type === 'ordered' ? 'ol' : 'ul';
  const listClass = type === 'ordered' 
    ? 'list-decimal list-inside space-y-2 mb-6 ml-4' 
    : 'list-disc list-inside space-y-2 mb-6 ml-4';
  
  return (
    <ListTag class={listClass}>
      <For each={items}>
        {(item: any) => <li class="leading-relaxed">{item.text}</li>}
      </For>
    </ListTag>
  );
}

function RenderSeparator(props: BlockProps): JSX.Element {
  return <hr class="border-t border-gray-300 my-8" />;
}

function RenderSpacer(props: BlockProps): JSX.Element {
  const content = props.block.content as any;
  const height = content?.height || '2rem';
  
  return <div style={{ height }} class="w-full" />;
}

function RenderUnknown(props: BlockProps): JSX.Element {
  // For unknown block types, try to render any text content
  const content = props.block.content as any;
  const text = content?.text || content?.content || '';
  
  if (text) {
    return <div class="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">{text}</div>;
  }
  
  return <div class="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 italic">
    Unsupported block type: {props.block.blockType}
  </div>;
}