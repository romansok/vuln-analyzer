import { Github, Star } from "lucide-react";
import { GH_REPO } from "@/lib/util";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="font-mono text-sm">
          vuln-<span className="gradient-text font-medium">analyzer</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={GH_REPO}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)]"
          >
            <Github className="h-3.5 w-3.5" />
            Source
          </a>
          <a
            href={`${GH_REPO}/stargazers`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)]"
          >
            <Star className="h-3.5 w-3.5 text-[var(--color-warn)]" />
            Star on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
