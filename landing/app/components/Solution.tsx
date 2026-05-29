"use client";

import { motion } from "framer-motion";
import {
  Target,
  Crosshair,
  Radar,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { SectionLabel } from "./SectionLabel";

type Feature = {
  kicker: string;
  icon: LucideIcon;
  title: string;
  body: React.ReactNode;
};

const features: Feature[] = [
  {
    kicker: "01",
    icon: Target,
    title: "Risk-ranked findings",
    body: (
      <>
        Sorted by grype&apos;s unified score &mdash;{" "}
        <span className="text-[var(--color-text)]">
          CVSS + EPSS + KEV + fix availability
        </span>{" "}
        &mdash; not just severity bucket. The few that matter, not the hundreds
        that don&apos;t.
      </>
    ),
  },
  {
    kicker: "02",
    icon: Radar,
    title: "Attack surface, mapped",
    body: (
      <>
        Who can reach the bug and over what channel &mdash; route, privilege
        level, network exposure &mdash; and exactly what an attacker gets if they
        do. Drawn from the CWE class, not vendor jargon.
      </>
    ),
  },
  {
    kicker: "03",
    icon: Crosshair,
    title: "Reachability with evidence",
    body: (
      <>
        Walks your source tree for vulnerable imports and call sites, then traces
        the dependency chain. Returns{" "}
        <span className="font-mono text-[var(--color-text)]">file:line</span> so you
        can verify before you act.
      </>
    ),
  },
  {
    kicker: "04",
    icon: Wrench,
    title: "Actionable remediation",
    body: (
      <>
        Primary fix (bump or configure) plus ranked workarounds with effort
        estimates &mdash; not just &ldquo;update to latest.&rdquo;
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
          <SectionLabel index="05" label="Features" />
          <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for <span className="gradient-text">developers who ship</span>,
            not security dashboards.
          </h2>
          <p className="mt-4 text-pretty text-[var(--color-muted)]">
            Four things on every finding.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-2">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.article
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: "easeOut" }}
                className="group relative bg-[var(--color-surface)] p-6 transition-colors hover:bg-[var(--color-surface-2)] sm:p-8"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs tracking-widest text-[var(--color-accent-1)]">
                    {f.kicker}
                  </span>
                  <Icon
                    className="h-4.5 w-4.5 text-[var(--color-muted-2)] transition-colors group-hover:text-[var(--color-accent-1)]"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="mt-5 text-lg font-medium text-[var(--color-text)]">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                  {f.body}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
