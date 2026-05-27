"use client";

import { motion } from "framer-motion";
import { ExternalLink, FileText, Terminal } from "lucide-react";
import { CodeBlock } from "./CodeBlock";
import { Tabs } from "./Tabs";
import { GH_INSTALL_DOC, GH_INSTALL_SH } from "@/lib/util";

const MANUAL = `git clone https://github.com/romansok/vuln-analyzer.git
cd vuln-analyzer

# Claude Code, user-level
mkdir -p ~/.claude/agents ~/.claude/skills
cp agents/*.md ~/.claude/agents/
cp -R skills/vuln-analyzer ~/.claude/skills/

# Cursor — swap ~/.claude for ~/.cursor in the three lines above.
`;

const ONELINER = `git clone https://github.com/romansok/vuln-analyzer.git
cd vuln-analyzer

./install.sh                                  # Claude Code, user-level
./install.sh --cursor                         # Cursor, user-level
./install.sh --project /abs/path/to/repo      # Project-local
./install.sh --force                          # Overwrite foreign files
`;

export function Install() {
  return (
    <section id="install" className="section-pad relative">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <span className="eyebrow">Install</span>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            One package. <span className="gradient-text">Claude Code or Cursor.</span>
          </h2>
          <p className="mt-4 text-pretty text-[var(--color-muted)]">
            The whole tool is a skill plus four agents &mdash; plain Markdown files you can
            read before you copy. Install manually if you prefer to see every move, or run{" "}
            <span className="font-mono text-[var(--color-text)]">install.sh</span> for the
            same result with a single command.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-10"
        >
          <Tabs
            tabs={[
              {
                id: "manual",
                label: "The manual way",
                hint: "recommended first read",
                content: (
                  <div className="space-y-4">
                    <CodeBlock
                      code={MANUAL}
                      language="bash"
                      caption="manual install · Claude Code"
                    />
                    <p className="flex items-start gap-2 text-sm text-[var(--color-muted)]">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted-2)]" />
                      Every file copied is plain Markdown you can{" "}
                      <span className="text-[var(--color-text)]">read first</span>.
                      No binaries, no post-install hooks, no compiled artifacts.
                    </p>
                  </div>
                ),
              },
              {
                id: "script",
                label: "Or the one-liner",
                hint: "install.sh",
                content: (
                  <div className="space-y-4">
                    <CodeBlock
                      code={ONELINER}
                      language="bash"
                      caption="install.sh — Claude & Cursor parity"
                    />
                    <p className="flex items-start gap-2 text-sm text-[var(--color-muted)]">
                      <Terminal className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted-2)]" />
                      Refuses to overwrite files it didn&apos;t put there; treats prior
                      vuln-analyzer installs as upgrades.{" "}
                      <a
                        href={GH_INSTALL_SH}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 underline-offset-2 hover:text-[var(--color-text)] hover:underline"
                      >
                        Read the script
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      .
                    </p>
                  </div>
                ),
              },
            ]}
          />
        </motion.div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-xs text-[var(--color-muted)]">
            <li>
              <span className="text-[var(--color-muted-2)]">requires </span>
              <span className="text-[var(--color-text)]">bash 3.2+</span>
            </li>
            <li>
              <span className="text-[var(--color-text)]">python3 3.8+</span>
            </li>
            <li>
              <span className="text-[var(--color-text)]">grype MCP</span>
              <span className="text-[var(--color-muted-2)]"> · server</span>
            </li>
            <li>
              <span className="text-[var(--color-muted-2)]">platforms </span>
              <span className="text-[var(--color-text)]">macOS · Linux · WSL</span>
            </li>
          </ul>
          <a
            href={GH_INSTALL_DOC}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            Full install guide
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </section>
  );
}
