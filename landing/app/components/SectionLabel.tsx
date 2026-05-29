/**
 * Editorial section index — renders `NN  LABEL ──────────`.
 * Used as the kicker above every section heading in place of a pill,
 * giving the page a consistent spec-sheet rhythm.
 */
export function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <div className="section-label">
      <span className="idx">{index}</span>
      <span className="lbl">{label}</span>
      <span className="line" aria-hidden />
    </div>
  );
}
