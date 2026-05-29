export type ExplanationEvidenceBasisLabel =
  | "evidence-backed"
  | "estimate"
  | "low-support"
  | "demo-derived"
  | "manual-review-required"
  | "deferred-scope";

export type ExplanationEvidenceBasisBadge = {
  readonly label: ExplanationEvidenceBasisLabel;
  readonly display: string;
  readonly detail: string;
  readonly warnBeforeSponsorSend: boolean;
};

export type ResolveExplanationEvidenceBasisInput = {
  readonly citationCount?: number | null;
  readonly faithfulnessSupportRatio?: number | null;
  readonly deterministicFallbackUsed?: boolean | null;
  readonly demoDerived?: boolean;
  readonly deferredScope?: boolean;
  readonly estimateOnly?: boolean;
};

function badge(
  label: ExplanationEvidenceBasisLabel,
  display: string,
  detail: string,
  warnBeforeSponsorSend: boolean,
): ExplanationEvidenceBasisBadge {
  return {
    label,
    display,
    detail,
    warnBeforeSponsorSend,
  };
}

function hasLowSupport(input: ResolveExplanationEvidenceBasisInput): boolean {
  const ratio = input.faithfulnessSupportRatio;

  if (typeof ratio !== "number" || !Number.isFinite(ratio)) {
    return false;
  }

  return ratio < 0.7;
}

export function resolveExplanationEvidenceBasisBadges(
  input: ResolveExplanationEvidenceBasisInput,
): readonly ExplanationEvidenceBasisBadge[] {
  const badges: ExplanationEvidenceBasisBadge[] = [];

  if (input.demoDerived === true) {
    badges.push(
      badge(
        "demo-derived",
        "Demo-derived",
        "Illustrative sample output; do not present as buyer evidence.",
        true,
      ),
    );
  }

  if (input.deferredScope === true) {
    badges.push(
      badge(
        "deferred-scope",
        "Deferred scope",
        "Some buyer asks are tracked outside the V1 readiness contract.",
        true,
      ),
    );
  }

  if (input.estimateOnly === true || input.deterministicFallbackUsed === true) {
    badges.push(
      badge(
        "estimate",
        "Estimate",
        "Narrative uses estimated or fallback context; verify before external send.",
        true,
      ),
    );
  }

  if (hasLowSupport(input)) {
    badges.push(
      badge(
        "low-support",
        "Low support",
        "Faithfulness support is below the sponsor-safe review threshold.",
        true,
      ),
    );
  }

  const citationCount = input.citationCount ?? 0;

  if (citationCount > 0 && !badges.some((item) => item.label === "low-support")) {
    badges.push(
      badge(
        "evidence-backed",
        "Evidence-backed",
        `${citationCount} persisted citation${citationCount === 1 ? "" : "s"} support this explanation.`,
        false,
      ),
    );
  }

  if (badges.length === 0) {
    badges.push(
      badge(
        "manual-review-required",
        "Manual review required",
        "No persisted citation or support ratio is available for this explanation.",
        true,
      ),
    );
  }

  return badges;
}
