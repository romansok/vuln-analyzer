"use client";

import { useEffect, useState } from "react";
import { Github, ShieldHalf } from "lucide-react";
import { cn, GH_REPO } from "@/lib/util";

const sections = [
  { id: "architecture", label: "Architecture" },
  { id: "usage", label: "Usage" },
  { id: "install", label: "Install" },
  { id: "features", label: "Features" },
  { id: "why", label: "Why" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-[var(--color-border)] bg-[color:rgb(9_9_11_/_0.78)] backdrop-blur-lg"
          : "border-b border-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a
          href="#top"
          className="group flex items-center gap-2.5 text-[var(--color-text)]"
          aria-label="vuln-analyzer home"
        >
          <span className="relative grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
            <ShieldHalf className="h-4 w-4 text-[var(--color-accent-1)] transition-transform group-hover:scale-110" />
          </span>
          <span className="font-mono text-sm tracking-tight">
            vuln-<span className="gradient-text font-medium">analyzer</span>
          </span>
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="rounded-md px-3 py-1.5 text-sm text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href={GH_REPO}
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)]"
        >
          <Github className="h-4 w-4" />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </nav>
    </header>
  );
}
