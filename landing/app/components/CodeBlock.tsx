"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/util";

type Props = {
  /** The code to render. Newlines preserved verbatim. */
  code: string;
  /** Small label shown in the header (e.g., "bash", "zsh"). */
  language?: string;
  /** Optional caption on the right side of the header. */
  caption?: string;
  className?: string;
};

export function CodeBlock({ code, language = "bash", caption, className }: Props) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — silently ignore. */
    }
  };

  return (
    <div className={cn("code-block", className)}>
      <div className="code-block-header">
        <span className="font-mono">{language}</span>
        <div className="flex items-center gap-3">
          {caption ? (
            <span className="hidden font-mono normal-case tracking-normal text-[var(--color-muted-2)] sm:inline">
              {caption}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onCopy}
            aria-label={copied ? "Copied" : "Copy to clipboard"}
            className="inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-[var(--color-muted)] transition-colors hover:border-[var(--color-border)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[var(--color-success)]" />
                <span>copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      <pre>
        <code>{highlight(code)}</code>
      </pre>
    </div>
  );
}

/**
 * Minimal syntax highlighter for shell-flavored code blocks. We deliberately
 * avoid a full grammar (no shiki/prismjs runtime cost) — comments and prompt
 * lines are the only things we tint.
 */
function highlight(code: string): React.ReactNode {
  const lines = code.split("\n");
  return lines.map((line, i) => {
    const newline = i < lines.length - 1 ? "\n" : "";
    // Full-line comment (# ...)
    const commentMatch = line.match(/^(\s*)(#.*)$/);
    if (commentMatch) {
      return (
        <span key={i}>
          {commentMatch[1]}
          <span style={{ color: "var(--color-muted-2)" }}>{commentMatch[2]}</span>
          {newline}
        </span>
      );
    }
    // Inline trailing comment (cmd args  # explanation)
    const inlineComment = line.match(/^(.*?)(\s{2,}#.*)$/);
    if (inlineComment) {
      return (
        <span key={i}>
          {inlineComment[1]}
          <span style={{ color: "var(--color-muted-2)" }}>{inlineComment[2]}</span>
          {newline}
        </span>
      );
    }
    return <span key={i}>{line}{newline}</span>;
  });
}
