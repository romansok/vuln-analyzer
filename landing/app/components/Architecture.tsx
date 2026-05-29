"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { SectionLabel } from "./SectionLabel";

type Agent = {
  name: string;
  role: string;
  returns: string;
  color: "blue" | "steel" | "skyblue";
};

const agents: Agent[] = [
  {
    name: "reachability-analyzer",
    role: "Walks the source tree for vulnerable imports and call sites.",
    returns: "verdict + file:line evidence",
    color: "blue",
  },
  {
    name: "context-analyzer",
    role: "Explains the CWE class in clear prose from a local playbook.",
    returns: "what-it-is, attack-surface, blast-radius",
    color: "steel",
  },
  {
    name: "remediation-analyzer",
    role: "Proposes the primary fix plus ranked workarounds with effort.",
    returns: "primary_fix + workaround list",
    color: "skyblue",
  },
];

const accentMap: Record<Agent["color"], string> = {
  blue: "var(--color-accent-1)",
  steel: "var(--color-accent-2)",
  skyblue: "var(--color-accent-3)",
};

export function Architecture() {
  return (
    <section id="architecture" className="section-pad relative">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <SectionLabel index="03" label="Architecture" />
          <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            Four agents. <span className="gradient-text">Parallel. Specialized.</span>
          </h2>
          <p className="mt-4 text-pretty text-[var(--color-muted)]">
            A thin orchestrator runs the scan, then dispatches a lead agent for each top
            finding. The lead fans out to three sub-agents in parallel and merges their
            outputs into a single developer-readable block.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="surface-card tick mt-14 overflow-hidden p-6 sm:p-10"
        >
          <Diagram />
        </motion.div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {agents.map((a, i) => (
            <motion.div
              key={a.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
              className="surface-card p-5"
              style={{
                boxShadow: `inset 3px 0 0 0 ${accentMap[a.color]}`,
              }}
            >
              <div
                className="font-mono text-[0.78rem]"
                style={{ color: accentMap[a.color] }}
              >
                {a.name}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text)]">
                {a.role}
              </p>
              <p className="mt-2 font-mono text-[0.7rem] uppercase tracking-wider text-[var(--color-muted-2)]">
                returns: <span className="normal-case text-[var(--color-muted)]">{a.returns}</span>
              </p>
            </motion.div>
          ))}
        </div>

        <p className="mt-10 flex items-start gap-3 text-sm text-[var(--color-muted)]">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]" />
          <span>
            The full grype JSON never enters the model&apos;s context &mdash; extraction
            happens via <span className="font-mono text-[var(--color-text)]">jq</span> in
            Bash, with a stdlib-only Python fallback when jq isn&apos;t installed.
          </span>
        </p>
      </div>
    </section>
  );
}

/**
 * Inline SVG diagram. ViewBox keeps it crisp at every width.
 *   - Orchestrator (top)
 *   - Lead agent (middle, gradient-bordered)
 *   - Three sub-agents (bottom row)
 */
function Diagram() {
  // Geometry — single source of truth for box positions so the connector
  // paths below stay aligned.
  const W = 920;
  const H = 460;

  const orch = { cx: W / 2, cy: 50, w: 260, h: 60 };
  const lead = { cx: W / 2, cy: 200, w: 340, h: 76 };
  const subY = 360;
  const subW = 240;
  const subH = 88;
  const subs = [
    { name: "reachability-analyzer", desc: "your source", cx: 140 + subW / 2, accent: "var(--color-accent-1)" },
    { name: "context-analyzer", desc: "CWE playbook", cx: W / 2, accent: "var(--color-accent-2)" },
    { name: "remediation-analyzer", desc: "fix paths", cx: W - 140 - subW / 2, accent: "var(--color-accent-3)" },
  ];

  // Single solid blue, used for connector lines and the lead box border.
  const LINE = "#3b82f6";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Architecture: orchestrator dispatches a lead vulnerability-analyzer agent which fans out to three sub-agents in parallel."
      className="block h-auto w-full"
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 Z" fill={LINE} fillOpacity="0.7" />
        </marker>
      </defs>

      {/* Connectors first, so boxes draw on top. */}
      {/* orch -> lead */}
      <path
        d={`M ${orch.cx} ${orch.cy + orch.h / 2} L ${lead.cx} ${lead.cy - lead.h / 2}`}
        stroke={LINE}
        strokeOpacity="0.55"
        strokeWidth="1.5"
        fill="none"
        markerEnd="url(#arrow)"
      />
      {/* lead -> 3 subs */}
      {subs.map((s) => (
        <path
          key={s.name}
          d={`M ${lead.cx} ${lead.cy + lead.h / 2} C ${lead.cx} ${lead.cy + lead.h / 2 + 70}, ${s.cx} ${subY - subH / 2 - 70}, ${s.cx} ${subY - subH / 2}`}
          stroke={LINE}
        strokeOpacity="0.55"
          strokeWidth="1.5"
          fill="none"
          markerEnd="url(#arrow)"
        />
      ))}

      {/* Orchestrator box */}
      <Box
        cx={orch.cx}
        cy={orch.cy}
        w={orch.w}
        h={orch.h}
        label="SKILL.md"
        sub="orchestrator"
        muted
      />

      {/* Lead box — solid blue border highlights its role. */}
      <g>
        <rect
          x={lead.cx - lead.w / 2}
          y={lead.cy - lead.h / 2}
          width={lead.w}
          height={lead.h}
          rx={12}
          fill="#121214"
          stroke={LINE}
          strokeWidth="1.5"
        />
        <text
          x={lead.cx}
          y={lead.cy - 4}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="16"
          fill="#fafafa"
        >
          vulnerability-analyzer
        </text>
        <text
          x={lead.cx}
          y={lead.cy + 18}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize="12"
          fill="#a1a1aa"
          letterSpacing="0.05em"
        >
          lead · validates · fans out · synthesizes
        </text>
      </g>

      {/* Sub-agent boxes */}
      {subs.map((s) => (
        <g key={s.name}>
          <rect
            x={s.cx - subW / 2}
            y={subY - subH / 2}
            width={subW}
            height={subH}
            rx={12}
            fill="#121214"
            stroke="#27272a"
            strokeWidth="1"
          />
          {/* left accent stripe */}
          <rect
            x={s.cx - subW / 2}
            y={subY - subH / 2}
            width={3}
            height={subH}
            rx={1.5}
            fill={s.accent}
          />
          <text
            x={s.cx}
            y={subY - 6}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="13"
            fill={s.accent}
          >
            {s.name}
          </text>
          <text
            x={s.cx}
            y={subY + 16}
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontSize="12"
            fill="#a1a1aa"
          >
            reads · {s.desc}
          </text>
          <text
            x={s.cx}
            y={subY + 32}
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontSize="10.5"
            fill="#71717a"
            letterSpacing="0.05em"
          >
            returns JSON
          </text>
        </g>
      ))}

      {/* Parallel-fork label */}
      <text
        x={W / 2}
        y={300}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="10.5"
        fill="#71717a"
        letterSpacing="0.18em"
      >
        ⟶ 3 TASKS · IN PARALLEL
      </text>
    </svg>
  );
}

function Box({
  cx,
  cy,
  w,
  h,
  label,
  sub,
  muted,
}: {
  cx: number;
  cy: number;
  w: number;
  h: number;
  label: string;
  sub: string;
  muted?: boolean;
}) {
  return (
    <g>
      <rect
        x={cx - w / 2}
        y={cy - h / 2}
        width={w}
        height={h}
        rx={12}
        fill="#121214"
        stroke={muted ? "#27272a" : "#3b82f6"}
        strokeWidth={muted ? 1 : 1.5}
      />
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="14"
        fill="#fafafa"
      >
        {label}
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        fontFamily="var(--font-sans)"
        fontSize="11.5"
        fill="#a1a1aa"
        letterSpacing="0.06em"
      >
        {sub}
      </text>
    </g>
  );
}
