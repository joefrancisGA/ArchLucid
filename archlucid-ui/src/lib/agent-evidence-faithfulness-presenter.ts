/** Long tooltip and column copy: deterministic grounding heuristic, not entailment or legal proof. */
export const EVIDENCE_FAITHFULNESS_HEURISTIC_DISCLAIMER =
  "0–1 evidence grounding ratio: deterministic overlap between claims/findings in the parsed agent JSON and the run evidence bundle (tokens and resolved evidence references). Not semantic entailment, not the embedding-cosine column, and not proof of factual correctness — use as a coarse operator signal alongside structural and semantic scores.";

export type EvidenceFaithfulnessTier = "absent" | "strong" | "moderate" | "weak";

function toOptionalUnitRatio(value: unknown): number | null {
  if (value === null || value === undefined)
    return null;

  const n = typeof value === "number" ? value : Number(value);


  if (!Number.isFinite(n) || n < 0 || n > 1)
    return null;

  return n;
}

/**
 * Maps support ratio to a coarse tier for operator badges. Thresholds are UX defaults (not server config).
 */
export function evidenceFaithfulnessTier(ratio: unknown): EvidenceFaithfulnessTier {
  const n = toOptionalUnitRatio(ratio);


  if (n === null)
    return "absent";

  if (n >= 0.65)
    return "strong";

  if (n >= 0.35)
    return "moderate";

  return "weak";
}

export type EvidenceFaithfulnessBadgePresentation = {
  tier: EvidenceFaithfulnessTier;
  /** Two decimal places when tier is not absent. */
  formattedRatio: string;
  /** Short label inside the pill (e.g. Strong). */
  tierLabel: string;
  /** Tailwind classes for the pill (background + text). */
  badgeClassName: string;
};

function tierLabel(tier: EvidenceFaithfulnessTier): string {
  switch (tier) {
    case "strong":
      return "Strong";
    case "moderate":
      return "Mixed";
    case "weak":
      return "Weak";
    case "absent":
      return "";
  }
}

function tierBadgeClassName(tier: EvidenceFaithfulnessTier): string {
  switch (tier) {
    case "strong":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200";
    case "moderate":
      return "bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-200";
    case "weak":
      return "bg-rose-100 text-rose-950 dark:bg-rose-950/45 dark:text-rose-200";
    case "absent":
      return "";
  }
}

/**
 * Presentation for a tiered “grounding” pill plus formatted numeric ratio.
 */
export function evidenceFaithfulnessBadgePresentation(ratio: unknown): EvidenceFaithfulnessBadgePresentation {
  const tier = evidenceFaithfulnessTier(ratio);
  const n = toOptionalUnitRatio(ratio);

  return {
    tier,
    formattedRatio: n === null ? "" : n.toFixed(2),
    tierLabel: tierLabel(tier),
    badgeClassName: tierBadgeClassName(tier),
  };
}
