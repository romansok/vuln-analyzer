// Auto-typed sequence for the TerminalDemo component.
//
// Each line is either:
//   - 'type'    — text is revealed character by character
//   - 'instant' — a pre-rendered React node appears as a unit (used for the
//                 ranking table and any line that's too visually dense to
//                 look good typing slowly)
//   - 'blank'   — empty line spacer
//
// `pause` is the delay (ms) AFTER the line finishes before the next starts.

import type { ReactNode } from "react";

export type TerminalLine =
  | { type: "type"; text: string; pause?: number; cls?: string }
  | { type: "instant"; node: ReactNode; pause?: number }
  | { type: "blank"; pause?: number };

/** Typing speed per character (ms). Lower = faster. */
export const TYPE_SPEED = 18;

/** Length of the pre-prompt sigil ("$ "). */
export const PROMPT_PREFIX = "$ ";
