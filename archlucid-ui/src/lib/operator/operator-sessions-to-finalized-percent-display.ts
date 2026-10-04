export type OperatorSessionsToFinalizedPercentPresentation = {
  readonly display: string;
  readonly footnote: string | null;
};

/** Process-lifetime session → finalize conversion (UU-468, UU-475). */
export function presentOperatorSessionsToFinalizedPercent(
  ratio: unknown,
  sessionsTotal: unknown,
): OperatorSessionsToFinalizedPercentPresentation {
  const sessions = typeof sessionsTotal === "number" ? sessionsTotal : Number(sessionsTotal);
  const r = typeof ratio === "number" ? ratio : Number(ratio);

  if (!Number.isFinite(sessions) || sessions <= 0) {
    return {
      display: "No sessions yet",
      footnote: "No sessions in this process lifetime (counters reset when the API host restarts).",
    };
  }

  if (!Number.isFinite(r)) {
    return { display: "Not returned", footnote: null };
  }

  if (r > 1) {
    return {
      display: "Not usable",
      footnote: `Ratio ${r.toFixed(2)} exceeds 1 — treat as a bad payload, not 100% conversion.`,
    };
  }

  const pct = Math.round(r * 100);

  if (!Number.isFinite(pct)) {
    return { display: "Not returned", footnote: null };
  }

  return {
    display: `${Math.max(0, pct)}%`,
    footnote: "Finalized reviews per completed session in this deployment lifetime.",
  };
}
