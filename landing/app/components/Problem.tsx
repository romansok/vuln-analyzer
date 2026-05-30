"use client";

import { motion } from "framer-motion";
import { AlertOctagon, HelpCircle, Check } from "lucide-react";
import { SectionLabel } from "./SectionLabel";

const cards = [
  {
    tone: "critical" as const,
    icon: AlertOctagon,
    eyebrow: "What scanners give you",
    title: "Numbers without meaning",
    body: (
      <>
        <span className="font-mono text-[var(--color-critical)]">Critical 24</span>{" "}
        <span className="font-mono text-[var(--color-warn)]">High 84</span>{" "}
        <span className="font-mono text-[var(--color-muted)]">Medium 68 …</span>
        <span className="mt-2 block text-[var(--color-muted-2)]">
          200+ rows of CVE ids and a severity bucket. Now what?
        </span>
      </>
    ),
  },
  {
    tone: "warn" as const,
    icon: HelpCircle,
    eyebrow: "What you actually need",
    title: "Three questions, every time",
    body: (
      <>
        <span className="block text-[var(--color-text)]">Is it reachable in <em>my</em> code?</span>
        <span className="block text-[var(--color-text)]">What does the CVE actually do?</span>
        <span className="block text-[var(--color-text)]">Bump, configure, or work around?</span>
      </>
    ),
  },
  {
    tone: "success" as const,
    icon: Check,
    eyebrow: "What vuln-analyzer gives you",
    title: "Answers, ranked",
    body: (
      <>
        Top 5 by real risk. <span className="text-[var(--color-text)]">file:line</span>{" "}
        evidence for reachability. The attack surface and CWE explained. Primary
        fix plus ranked workarounds with effort estimates.
      </>
    ),
  },
];

const toneStyle: Record<
  "critical" | "warn" | "success",
  { ring: string; iconBg: string; iconFg: string }
> = {
  // RGB triplets here mirror the CSS token values so the ring/icon-bg
  // tints sit on the same hue as the icon foreground.
  critical: {
    // --color-critical: #ef4444 (red-500)
    ring: "ring-[color:rgb(239_68_68_/_0.35)]",
    iconBg: "bg-[color:rgb(239_68_68_/_0.1)]",
    iconFg: "text-[var(--color-critical)]",
  },
  warn: {
    // --color-warn: #f59e0b (amber-500)
    ring: "ring-[color:rgb(245_158_11_/_0.3)]",
    iconBg: "bg-[color:rgb(245_158_11_/_0.1)]",
    iconFg: "text-[var(--color-warn)]",
  },
  success: {
    // --color-accent-1: #3b82f6 (blue-500)
    ring: "ring-[color:rgb(59_130_246_/_0.35)]",
    iconBg: "bg-[color:rgb(59_130_246_/_0.1)]",
    iconFg: "text-[var(--color-accent-1)]",
  },
};

export function Problem() {
  return (
    <section id="why" className="section-pad relative">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <SectionLabel index="05" label="Why" />
          <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            Scanners shout. They don&apos;t <span className="gradient-text">explain</span>.
          </h2>
          <p className="mt-4 text-pretty text-[var(--color-muted)]">
            Grype, Trivy, and Snyk are great at finding vulnerabilities. They&apos;re bad
            at telling you what to do about them.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {cards.map((c, i) => {
            const Icon = c.icon;
            const s = toneStyle[c.tone];
            return (
              <motion.div
                key={c.eyebrow}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
                className={`surface-card relative flex flex-col gap-4 p-6 ring-1 ${s.ring}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`grid h-9 w-9 place-items-center rounded-lg ${s.iconBg}`}>
                    <Icon className={`h-4.5 w-4.5 ${s.iconFg}`} />
                  </span>
                  <span className="font-mono text-[0.7rem] uppercase tracking-wider text-[var(--color-muted-2)]">
                    {c.eyebrow}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-[var(--color-text)]">
                  {c.title}
                </h3>
                <div className="text-sm leading-relaxed text-[var(--color-muted)]">
                  {c.body}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
