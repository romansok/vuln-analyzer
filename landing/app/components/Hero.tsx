"use client";

import { motion } from "framer-motion";
import { ArrowRight, Github } from "lucide-react";
import { GH_REPO } from "@/lib/util";
import { TerminalDemo } from "./TerminalDemo";

export function Hero() {
  return (
    <section
      id="top"
      className="relative isolate overflow-hidden pt-28 sm:pt-32"
    >
      {/* Ambient gradient orb (decorative). */}
      <div className="hero-orb" aria-hidden />
      {/* Faint grid behind content. */}
      <div
        className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-20"
        aria-hidden
      />

      <div className="mx-auto max-w-6xl px-5 pb-16 sm:px-8 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-start"
        >
          <span className="hero-tag">
            <span className="dot" aria-hidden />
            vuln-analyzer · for Claude Code &amp; Cursor
          </span>

          <h1 className="mt-6 max-w-4xl text-[2.5rem] font-semibold leading-[1.05] tracking-tight text-balance sm:text-6xl md:text-7xl">
            Understand vulnerabilities.{" "}
            <span className="gradient-text">Don&apos;t just count them.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-[var(--color-muted)] sm:text-lg">
            An agentic vulnerability analyzer that ranks what matters, traces
            the <span className="text-[var(--color-text)]">attack surface</span>,
            finds it in your code with{" "}
            <span className="text-[var(--color-text)]">file:line</span>{" "}
            evidence, and tells you how to fix it.
          </p>

          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <a
              href="#install"
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-accent-1)] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-3)]"
            >
              Quick install
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>

            <a
              href={GH_REPO}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)]"
            >
              <Github className="h-4 w-4" />
              View on GitHub
            </a>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[var(--color-muted-2)]">
            <li className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
              MIT licensed
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-3)]" />
              Local-only · JSON never leaves your machine
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-1)]" />
              Powered by grype-mcp
            </li>
          </ul>
        </motion.div>

        {/* The live terminal demo is the hero's centerpiece — it sits
            directly under the value prop, no section heading. */}
        <TerminalDemo />
      </div>
    </section>
  );
}
