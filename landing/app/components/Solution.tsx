"use client";

import { motion } from "framer-motion";
import {
  Target,
  Crosshair,
  BookOpen,
  Wrench,
} from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Risk-ranked top 5",
    body: (
      <>
        Sorted by grype&apos;s unified score &mdash; <span className="text-[var(--color-text)]">CVSS + EPSS + KEV + fix
        availability</span> &mdash; not just severity bucket. The 5 that matter, not the 200
        that don&apos;t.
      </>
    ),
  },
  {
    icon: Crosshair,
    title: "Reachability with evidence",
    body: (
      <>
        Walks your source tree for vulnerable imports and call sites. Returns{" "}
        <span className="font-mono text-[var(--color-text)]">file:line</span> so you can verify
        before you act.
      </>
    ),
  },
  {
    icon: BookOpen,
    title: "Plain-English impact",
    body: (
      <>
        Explains the CWE class &mdash; what the bug actually does and what an attacker
        gets &mdash; from a local 19-entry playbook. No vendor jargon.
      </>
    ),
  },
  {
    icon: Wrench,
    title: "Actionable remediation",
    body: (
      <>
        Primary fix (bump or configure) plus ranked workarounds with effort estimates.
        Not just &ldquo;update to latest.&rdquo;
      </>
    ),
  },
];

export function Solution() {
  return (
    <section id="features" className="section-pad relative">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <span className="eyebrow">What you get</span>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for <span className="gradient-text">developers who ship</span>,
            not security dashboards.
          </h2>
          <p className="mt-4 text-pretty text-[var(--color-muted)]">
            Four guarantees on every run.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.article
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: "easeOut" }}
                className="surface-card group relative overflow-hidden p-6 sm:p-7 transition-colors hover:border-[color:rgb(59_130_246_/_0.4)]"
              >
                <div className="flex items-start gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-accent-1)] transition-colors group-hover:text-[var(--color-accent-3)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-medium text-[var(--color-text)]">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                      {f.body}
                    </p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
