"use client";

import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { Tabs } from "./Tabs";

type Prompt = { text: string; note?: string };

const scanPrompts: Prompt[] = [
  { text: "Scan /Users/me/repo for vulnerabilities." },
  { text: "Audit dependencies in this project.", note: "uses your cwd" },
  { text: "Run grype on /path/to/project." },
  { text: "Check the security of this codebase." },
];

const standalonePrompts: Prompt[] = [
  { text: "analyze CVE-2023-32314" },
  { text: "what does GHSA-whpj-8f3w-67p5 mean for us?" },
  { text: "explain RUSTSEC-2024-0001" },
  { text: "look at https://github.com/advisories/GHSA-xxxx-xxxx-xxxx" },
];

const grypeOnlyPrompts: Prompt[] = [
  { text: "Use grype to scan this directory.", note: "raw output, no agent" },
  { text: "Run grype against alpine:3.10.6 and list only fixed vulns." },
  { text: "Export grype results for my project as SARIF." },
  { text: "Scan sbom:bom.json with grype." },
];

function PromptList({ prompts }: { prompts: Prompt[] }) {
  return (
    <ul className="space-y-3">
      {prompts.map((p) => (
        <li
          key={p.text}
          className="group flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 transition-colors hover:border-[var(--color-border-strong)]"
        >
          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted-2)] transition-colors group-hover:text-[var(--color-accent-1)]" />
          <div className="flex-1">
            <p className="font-mono text-sm text-[var(--color-text)]">{p.text}</p>
            {p.note ? (
              <p className="mt-0.5 text-xs text-[var(--color-muted-2)]">{p.note}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Usage() {
  return (
    <section id="usage" className="section-pad relative">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <span className="eyebrow">Usage</span>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            Ask in <span className="gradient-text">plain English</span>.
          </h2>
          <p className="mt-4 text-pretty text-[var(--color-muted)]">
            Three modes, composable. Run the full pipeline, analyze a single
            advisory without a scan, or invoke grype on its own &mdash; same
            assistant, same prompt box.
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
                id: "scan",
                label: "Full pipeline",
                hint: "scan + analyze",
                content: (
                  <div className="space-y-4">
                    <ModeNote>
                      <span className="font-mono text-[var(--color-text)]">
                        vuln-analyzer
                      </span>{" "}
                      drives <span className="font-mono text-[var(--color-text)]">grype</span>:
                      scan, rank, and analyze the top 5 with reachability + remediation.
                    </ModeNote>
                    <PromptList prompts={scanPrompts} />
                  </div>
                ),
              },
              {
                id: "standalone",
                label: "Analyze one CVE",
                hint: "vuln-analyzer alone",
                content: (
                  <div className="space-y-4">
                    <ModeNote>
                      The vulnerability-analyzer agent runs without a scan. No
                      grype invocation, just plain-English explanation of one
                      advisory.
                    </ModeNote>
                    <PromptList prompts={standalonePrompts} />
                  </div>
                ),
              },
              {
                id: "grype",
                label: "Raw grype scan",
                hint: "grype-mcp alone",
                content: (
                  <div className="space-y-4">
                    <ModeNote>
                      Skip the analyzer and call grype directly. Useful for
                      SARIF export, container images, or when you just want the
                      vulnerability list, raw.
                    </ModeNote>
                    <PromptList prompts={grypeOnlyPrompts} />
                  </div>
                ),
              },
            ]}
          />
        </motion.div>
      </div>
    </section>
  );
}

function ModeNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-xs leading-relaxed text-[var(--color-muted)]">
      {children}
    </p>
  );
}
