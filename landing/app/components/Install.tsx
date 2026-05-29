"use client";

import { motion } from "framer-motion";
import { Download, ExternalLink, FileText, Terminal } from "lucide-react";
import { CodeBlock } from "./CodeBlock";
import { Tabs } from "./Tabs";
import { SectionLabel } from "./SectionLabel";
import {
  GH_INSTALL_DOC,
  GH_INSTALL_SH,
  GRYPE_MCP_README,
  GRYPE_MCP_RELEASES,
} from "@/lib/util";

const GRYPE_MCP_CONFIG = `{
  "mcpServers": {
    "grype": {
      "command": "/path/to/grype",
      "args": ["mcp"]
    }
  }
}
`;

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
          <SectionLabel index="04" label="Install" />
          <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            Two pieces, <span className="gradient-text">in order</span>.
          </h2>
          <p className="mt-4 text-pretty text-[var(--color-muted)]">
            First the <span className="font-mono text-[var(--color-text)]">grype</span>{" "}
            MCP server (the scanner that finds vulnerabilities), then{" "}
            <span className="font-mono text-[var(--color-text)]">vuln-analyzer</span>{" "}
            (the skill + agents that explain and prioritize them). Each is useful
            on its own.
          </p>
        </motion.div>

        {/* Step 1 — grype MCP */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-12"
        >
          <StepHeader
            n={1}
            title="grype MCP server"
            sub="The scanner. A drop-in grype CLI with an extra `grype mcp` command."
          />
          <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <CodeBlock
              code={GRYPE_MCP_CONFIG}
              language="json"
              caption="mcpServers entry"
            />
            <div className="surface-card flex flex-col gap-3 p-5">
              <div className="flex items-start gap-3">
                <Download className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent-1)]" />
                <div className="text-sm text-[var(--color-muted)]">
                  <span className="text-[var(--color-text)]">Download the binary</span>{" "}
                  for your platform from{" "}
                  <a
                    href={GRYPE_MCP_RELEASES}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-[var(--color-accent-1)] underline-offset-2 hover:text-[var(--color-accent-3)] hover:underline"
                  >
                    grype-mcp releases
                    <ExternalLink className="h-3 w-3" />
                  </a>{" "}
                  and put it on your <span className="font-mono text-[var(--color-text)]">PATH</span>.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent-1)]" />
                <div className="text-sm text-[var(--color-muted)]">
                  Paste the JSON into{" "}
                  <span className="font-mono text-[var(--color-text)]">~/.claude/settings.json</span>{" "}
                  for Claude Code, or{" "}
                  <span className="font-mono text-[var(--color-text)]">.cursor/mcp.json</span>{" "}
                  for Cursor. Replace{" "}
                  <span className="font-mono text-[var(--color-text)]">/path/to/grype</span>{" "}
                  with the binary path (or just{" "}
                  <span className="font-mono text-[var(--color-text)]">&quot;grype&quot;</span>{" "}
                  if it&apos;s on your PATH).
                </div>
              </div>
              <a
                href={GRYPE_MCP_README}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-1 inline-flex items-center gap-1 self-start text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                Full grype-mcp guide
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </motion.div>

        {/* Step 2 — vuln-analyzer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-12"
        >
          <StepHeader
            n={2}
            title="vuln-analyzer skill + agents"
            sub="One skill, four agents. Plain Markdown you can read before you copy."
          />
          <div className="mt-5">
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
                        Refuses to overwrite files it didn&apos;t put there; treats
                        prior vuln-analyzer installs as upgrades.{" "}
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
          </div>
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
              <span className="text-[var(--color-muted-2)]"> · step 1</span>
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

function StepHeader({
  n,
  title,
  sub,
}: {
  n: number;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-baseline gap-4">
      <span
        aria-hidden
        className="font-mono text-xs uppercase tracking-widest text-[var(--color-accent-1)]"
      >
        Step {n}
      </span>
      <div>
        <h3 className="text-xl font-medium text-[var(--color-text)]">{title}</h3>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{sub}</p>
      </div>
    </div>
  );
}
