"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/util";

export type Tab = {
  id: string;
  label: string;
  hint?: string;
  content: ReactNode;
};

type Props = {
  tabs: Tab[];
  initial?: string;
  className?: string;
};

export function Tabs({ tabs, initial, className }: Props) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label="Variants"
        className="inline-flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
      >
        {tabs.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${t.id}`}
              id={`tab-${t.id}`}
              type="button"
              onClick={() => setActive(t.id)}
              className={cn(
                "relative rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                selected
                  ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
              )}
            >
              {t.label}
              {t.hint ? (
                <span className="ml-2 hidden font-mono text-[0.7rem] text-[var(--color-muted-2)] sm:inline">
                  {t.hint}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`panel-${current.id}`}
        aria-labelledby={`tab-${current.id}`}
        className="mt-5"
      >
        {current.content}
      </div>
    </div>
  );
}
