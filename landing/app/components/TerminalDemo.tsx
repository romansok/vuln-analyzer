"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import {
  TYPE_SPEED,
  PROMPT_PREFIX,
  type TerminalLine,
} from "@/lib/terminal-script";
import { SectionLabel } from "./SectionLabel";

/* -------------------------------------------------------------------------
 * Script
 * -------------------------------------------------------------------------
 * Lives inside the component file because individual lines use React JSX
 * for color highlighting. The lib/terminal-script.ts module owns the types
 * + tuning constants so the script itself stays self-contained.
 * ------------------------------------------------------------------------- */

const C = {
  prompt: "text-[var(--color-accent-3)]",   // $ and ▸ — soft blue
  ok: "text-[var(--color-success)]",
  critical: "text-[var(--color-critical)]",
  high: "text-[var(--color-warn)]",
  med: "text-[var(--color-muted)]",
  accent: "text-[var(--color-accent-1)]",   // file paths, risk scores — primary blue
  cyan: "text-[var(--color-accent-3)]",     // light blue (alias kept for clarity)
  muted: "text-[var(--color-muted-2)]",
  text: "text-[var(--color-text)]",
};

function TableRow({
  id,
  risk,
  sev,
  sevClass,
  purl,
  fix,
}: {
  id: string;
  risk: string;
  sev: string;
  sevClass: string;
  purl: string;
  fix: string;
}) {
  // Fixed-width columns via padded strings for authentic alignment.
  return (
    <div>
      <span className={C.muted}>{"│ "}</span>
      <span>{id.padEnd(24)}</span>
      <span className={C.muted}>{" │ "}</span>
      <span className={C.cyan}>{risk.padEnd(5)}</span>
      <span className={C.muted}>{" │ "}</span>
      <span className={sevClass}>{sev.padEnd(8)}</span>
      <span className={C.muted}>{" │ "}</span>
      <span>{purl.padEnd(20)}</span>
      <span className={C.muted}>{" │ "}</span>
      <span className={C.ok}>{fix.padEnd(8)}</span>
      <span className={C.muted}>{" │"}</span>
    </div>
  );
}

const Table = (
  // Each row is `whitespace-nowrap` so it doesn't wrap on narrow viewports;
  // the outer container scrolls horizontally instead, preserving alignment.
  <div className="-mx-1.5 overflow-x-auto whitespace-nowrap text-[0.78rem] leading-relaxed">
    <div className={C.muted}>
      ┌──────────────────────────┬───────┬──────────┬──────────────────────┬──────────┐
    </div>
    <div>
      <span className={C.muted}>│ </span>
      <span className={C.text}>VulnID                  </span>
      <span className={C.muted}> │ </span>
      <span className={C.text}>Risk </span>
      <span className={C.muted}> │ </span>
      <span className={C.text}>Severity</span>
      <span className={C.muted}> │ </span>
      <span className={C.text}>PURL                </span>
      <span className={C.muted}> │ </span>
      <span className={C.text}>Fix     </span>
      <span className={C.muted}> │</span>
    </div>
    <div className={C.muted}>
      ├──────────────────────────┼───────┼──────────┼──────────────────────┼──────────┤
    </div>
    <TableRow id="GHSA-whpj-8f3w-67p5" risk="61.0" sev="Critical" sevClass={C.critical} purl="vm2@3.9.17" fix="3.9.18" />
    <TableRow id="GHSA-g644-9gfx-q4q4" risk="34.2" sev="Critical" sevClass={C.critical} purl="vm2@3.9.17" fix="—" />
    <TableRow id="GHSA-c7hr-j4mj-j2w6" risk="33.7" sev="Critical" sevClass={C.critical} purl="jsonwebtoken@0.1.0" fix="4.2.2" />
    <TableRow id="GHSA-jf85-cpcp-j695" risk="13.4" sev="Critical" sevClass={C.critical} purl="lodash@2.4.2" fix="4.17.12" />
    <TableRow id="GHSA-cchq-frgv-rjh5" risk="4.5" sev="Critical" sevClass={C.critical} purl="vm2@3.9.17" fix="3.10.0" />
    <div className={C.muted}>
      └──────────────────────────┴───────┴──────────┴──────────────────────┴──────────┘
    </div>
  </div>
);

// Label column padded to 16 chars so the values align in a clean gutter.
const SynthesisIntro = (
  <div className="mt-2">
    <span className={C.muted}>### </span>
    <span className={C.text}>GHSA-whpj-8f3w-67p5</span>
    <span className={C.muted}> — </span>
    <span className={`${C.text} font-medium`}>vm2 sandbox escape (host RCE)</span>
  </div>
);

const SynthesisBugClass = (
  <div>
    <span className={C.cyan}>{"Bug class       "}</span>
    <span className={C.text}>CWE-74</span>
    <span className={C.muted}> · Injection</span>
  </div>
);

const SynthesisAttackSurface = (
  <div>
    <span className={C.cyan}>{"Attack surface  "}</span>
    <span className={C.accent}>POST /rest/chatbot/respond</span>
    <span className={C.muted}> · authenticated user · network</span>
    <span className={C.critical}> (CVSS 9.8)</span>
  </div>
);

const SynthesisReachable = (
  <div>
    <span className={C.cyan}>{"Reachable?      "}</span>
    <span className={`${C.ok} font-medium`}>✓ Direct</span>
    <span className={C.muted}> — </span>
    <span className={C.accent}>routes/chatbot.ts:104</span>
    <span className={C.muted}> → juicy-chat-bot → vm2@3.9.17</span>
  </div>
);

const SynthesisImpact = (
  <div>
    <span className={C.cyan}>{"Impact          "}</span>
    <span>Full remote code execution on the Node host process.</span>
  </div>
);

const SynthesisFix = (
  <div>
    <span className={C.cyan}>{"Fix             "}</span>
    <span className={C.muted}>overrides </span>
    <span className={C.text}>{'{ "vm2": ">=3.9.18" }'}</span>
    <span className={C.muted}> → npm install</span>
  </div>
);

const SynthesisConfidence = (
  <div>
    <span className={C.cyan}>{"Confidence      "}</span>
    <span className={C.ok}>High</span>
  </div>
);

const SCRIPT: TerminalLine[] = [
  { type: "type", text: `${PROMPT_PREFIX}scan this codebase for vulnerabilities`, cls: C.text, pause: 380 },
  { type: "type", text: `▸ Scanned: dir:/Users/dev/juice-shop`, cls: C.muted, pause: 280 },
  { type: "type", text: `▸ 182 matches · 126 distinct vulns`, cls: C.muted, pause: 120 },
  { type: "type", text: `▸ Critical 24 · High 84 · Medium 69 · Low 5`, cls: C.muted, pause: 360 },
  { type: "blank", pause: 80 },
  { type: "instant", node: Table, pause: 600 },
  { type: "blank", pause: 80 },
  { type: "instant", node: SynthesisIntro, pause: 220 },
  { type: "instant", node: SynthesisBugClass, pause: 200 },
  { type: "instant", node: SynthesisAttackSurface, pause: 340 },
  { type: "instant", node: SynthesisReachable, pause: 320 },
  { type: "instant", node: SynthesisImpact, pause: 240 },
  { type: "instant", node: SynthesisFix, pause: 240 },
  { type: "instant", node: SynthesisConfidence, pause: 200 },
];

/* -------------------------------------------------------------------------
 * Component
 * ------------------------------------------------------------------------- */

export function TerminalDemo() {
  // How many lines from SCRIPT we've finished. `partial` holds the characters
  // typed so far for the in-progress line (only meaningful when current
  // line is type === 'type').
  const [completed, setCompleted] = useState(0);
  const [partial, setPartial] = useState("");
  const [done, setDone] = useState(false);
  const [version, setVersion] = useState(0); // re-run id
  const timeouts = useRef<number[]>([]);

  const reducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const clearTimers = useCallback(() => {
    timeouts.current.forEach((t) => window.clearTimeout(t));
    timeouts.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timeouts.current.push(id);
  }, []);

  /** Drive the script forward. Re-runs whenever `version` changes. */
  useEffect(() => {
    clearTimers();
    setCompleted(0);
    setPartial("");
    setDone(false);

    if (reducedMotion) {
      setCompleted(SCRIPT.length);
      setDone(true);
      return;
    }

    let lineIdx = 0;
    const runLine = () => {
      if (lineIdx >= SCRIPT.length) {
        setDone(true);
        return;
      }
      const line = SCRIPT[lineIdx];
      if (line.type === "blank") {
        schedule(() => {
          setCompleted((c) => c + 1);
          lineIdx += 1;
          runLine();
        }, line.pause ?? 80);
        return;
      }
      if (line.type === "instant") {
        schedule(() => {
          setCompleted((c) => c + 1);
          lineIdx += 1;
          runLine();
        }, line.pause ?? 200);
        return;
      }
      // type
      const text = line.text;
      let charIdx = 0;
      setPartial("");
      const typeNext = () => {
        charIdx += 1;
        setPartial(text.slice(0, charIdx));
        if (charIdx < text.length) {
          schedule(typeNext, TYPE_SPEED);
        } else {
          schedule(() => {
            setCompleted((c) => c + 1);
            setPartial("");
            lineIdx += 1;
            runLine();
          }, line.pause ?? 200);
        }
      };
      typeNext();
    };
    runLine();

    return clearTimers;
    // version is the re-run trigger; SCRIPT is module-level (stable).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, reducedMotion]);

  const replay = () => {
    clearTimers();
    setVersion((v) => v + 1);
  };

  return (
    <section className="section-pad relative">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <SectionLabel index="02" label="Live output" />
          <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            See it on a real <span className="gradient-text">juice-shop</span>.
          </h2>
          <p className="mt-4 text-pretty text-[var(--color-muted)]">
            One prompt &mdash; and every finding comes back with its attack
            surface, reachability, and a one-step fix.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="terminal mt-10"
        >
          <div className="terminal-header">
            <span className="terminal-dot bg-[#f97373]" />
            <span className="terminal-dot bg-[#f7c948]" />
            <span className="terminal-dot bg-[#7bd88f]" />
            <span className="ml-3 font-mono text-[0.72rem] uppercase tracking-widest text-[var(--color-muted-2)]">
              ~/juice-shop · vuln-analyzer
            </span>
            <button
              type="button"
              onClick={replay}
              aria-label="Replay demo"
              className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-[0.72rem] uppercase tracking-widest text-[var(--color-muted)] transition-colors hover:border-[var(--color-border)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
            >
              <RotateCcw className="h-3 w-3" />
              <span>{done ? "replay" : "running"}</span>
            </button>
          </div>

          <div className="terminal-body">
            {SCRIPT.slice(0, completed).map((line, i) => (
              <LineView key={`done-${version}-${i}`} line={line} />
            ))}
            {!done && completed < SCRIPT.length ? (
              <CurrentLine
                line={SCRIPT[completed]}
                partial={partial}
                showCursor={SCRIPT[completed]?.type === "type"}
              />
            ) : null}
            {done ? (
              <div className="mt-4">
                <span className={C.prompt}>$ </span>
                <span className="terminal-cursor" />
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function LineView({ line }: { line: TerminalLine }) {
  if (line.type === "blank") return <div>&nbsp;</div>;
  if (line.type === "instant") return <>{line.node}</>;
  return <div className={line.cls}>{colorizeStaticLine(line.text)}</div>;
}

function CurrentLine({
  line,
  partial,
  showCursor,
}: {
  line: TerminalLine;
  partial: string;
  showCursor: boolean;
}) {
  if (line.type === "blank") return <div>&nbsp;</div>;
  if (line.type === "instant") return null; // skipped during instant pause
  return (
    <div className={line.cls}>
      {colorizeStaticLine(partial)}
      {showCursor ? <span className="terminal-cursor" /> : null}
    </div>
  );
}

/**
 * Apply a few cheap recolorings to typed lines: the leading "$ " gets the
 * prompt accent; "▸" gets the same. Everything else inherits the line's
 * default class.
 */
function colorizeStaticLine(text: string): React.ReactNode {
  if (text.startsWith(PROMPT_PREFIX)) {
    return (
      <>
        <span className={C.prompt}>{PROMPT_PREFIX}</span>
        <span className={C.text}>{text.slice(PROMPT_PREFIX.length)}</span>
      </>
    );
  }
  if (text.startsWith("▸")) {
    return (
      <>
        <span className={C.prompt}>▸</span>
        <span>{text.slice(1)}</span>
      </>
    );
  }
  return text;
}
