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
            Once installed, any of these phrasings routes to the right entry point.
            Scan a directory, or analyze a single advisory without a scan at all.
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
                label: "Scan a project",
                hint: "full pipeline",
                content: <PromptList prompts={scanPrompts} />,
              },
              {
                id: "standalone",
                label: "Analyze one CVE",
                hint: "no scan needed",
                content: <PromptList prompts={standalonePrompts} />,
              },
            ]}
          />
        </motion.div>
      </div>
    </section>
  );
}
