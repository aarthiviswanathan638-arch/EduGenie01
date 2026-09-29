import React, { useMemo } from 'react';
import { marked } from 'marked';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const parsedHtml = useMemo(() => {
    marked.setOptions({
      gfm: true,
      breaks: true,
    });
    return marked.parse(content) as string;
  }, [content]);

  // Handle copying code blocks if user clicks
  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div
      className={`prose prose-slate max-w-none text-slate-800 leading-relaxed text-sm md:text-base font-normal ${className}`}
      dangerouslySetInnerHTML={{ __html: parsedHtml }}
    />
  );
};
