import { Github, Star } from "lucide-react";
import { GH_LICENSE, GH_REPO, GRYPE_MCP } from "@/lib/util";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex flex-col gap-1.5">
          <div className="font-mono text-sm">
            vuln-<span className="gradient-text font-medium">analyzer</span>
          </div>
          <p className="text-xs text-[var(--color-muted)]">
            © {year} Roman Sok ·{" "}
            <a
              href={GH_LICENSE}
              target="_blank"
              rel="noreferrer noopener"
              className="underline-offset-2 hover:text-[var(--color-text)] hover:underline"
            >
              MIT
            </a>{" "}
            · Built on{" "}
            <a
              href={GRYPE_MCP}
              target="_blank"
              rel="noreferrer noopener"
              className="underline-offset-2 hover:text-[var(--color-text)] hover:underline"
            >
              grype-mcp
            </a>
            .
          </p>
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
