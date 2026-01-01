"use client"

import { useMemo } from "react"

interface MarkdownPreviewProps {
  content: string
  className?: string
}

export function MarkdownPreview({ content, className = "" }: MarkdownPreviewProps) {
  const htmlContent = useMemo(() => {
    if (!content) return ""

    const html = content
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-foreground mt-6 mb-2">$1</h3>')
      .replace(
        /^## (.*$)/gim,
        '<h2 class="text-xl font-bold text-foreground mt-8 mb-3 pb-2 border-b border-border/30">$1</h2>',
      )
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-primary mt-8 mb-4">$1</h1>')
      // Bold and italic
      .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong class="font-bold"><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-foreground">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em class="italic text-muted-foreground">$1</em>')
      // Code blocks
      .replace(
        /```(\w+)?\n([\s\S]*?)```/gim,
        '<pre class="bg-muted/30 border border-border/50 rounded-lg p-4 my-4 overflow-x-auto text-sm font-mono"><code>$2</code></pre>',
      )
      .replace(/`(.*?)`/gim, '<code class="bg-muted/40 px-1.5 py-0.5 rounded text-sm font-mono text-primary">$1</code>')
      // Lists
      .replace(/^\s*[-*]\s+(.*$)/gim, '<li class="ml-4 text-muted-foreground">$1</li>')
      .replace(/(<li.*<\/li>\n?)+/gim, '<ul class="list-disc list-inside my-3 space-y-1">$&</ul>')
      .replace(/^\d+\.\s+(.*$)/gim, '<li class="ml-4 text-muted-foreground">$1</li>')
      // Blockquotes
      .replace(
        /^>\s+(.*$)/gim,
        '<blockquote class="border-l-4 border-primary/50 pl-4 py-1 my-4 italic text-muted-foreground">$1</blockquote>',
      )
      // Horizontal rules
      .replace(/^---$/gim, '<hr class="my-6 border-border/30" />')
      // Links
      .replace(
        /\[([^\]]+)\]$$([^)]+)$$/gim,
        '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener">$1</a>',
      )
      // Tables (basic)
      .replace(/\|(.+)\|/gim, (match) => {
        const cells = match.split("|").filter((c) => c.trim())
        const isHeader = match.includes("---")
        if (isHeader) return ""
        return `<tr class="border-b border-border/30">${cells.map((c) => `<td class="px-3 py-2 text-sm">${c.trim()}</td>`).join("")}</tr>`
      })
      // Paragraphs
      .replace(/\n\n/gim, '</p><p class="text-muted-foreground leading-relaxed my-3">')
      // Line breaks
      .replace(/\n/gim, "<br />")

    return `<div class="prose-custom"><p class="text-muted-foreground leading-relaxed my-3">${html}</p></div>`
  }, [content])

  return <div className={`markdown-preview ${className}`} dangerouslySetInnerHTML={{ __html: htmlContent }} />
}
