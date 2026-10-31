import { normalizeFiniteRatio } from "@/types/explanation";

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
  readonly faithfulnessSupportRatio?: number | string | null;
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
  const ratio = normalizeFiniteRatio(input.faithfulnessSupportRatio);

  if (ratio === null) {
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
        "Some buyer asks are tracked outside the current product readiness contract.",
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
        "Faithfulness support is below the export-ready review threshold.",
        true,
      ),
    );
  }

  if (input.citationCount !== null && input.citationCount !== undefined && input.citationCount > 0) {
    if (!badges.some((item) => item.label === "low-support")) {
      const citationCount = input.citationCount;
      badges.push(
        badge(
          "evidence-backed",
          "Evidence-backed",
          `${citationCount} persisted citation${citationCount === 1 ? "" : "s"} support this explanation.`,
          false,
        ),
      );
    }
  }

  if (
    (input.faithfulnessSupportRatio === null || input.faithfulnessSupportRatio === undefined)
    && input.citationCount !== null
    && input.citationCount !== undefined
  ) {
    badges.push(
      badge(
        "manual-review-required",
        "Faithfulness support ratio was not stored.",
        "Faithfulness support ratio was not stored for this explanation.",
        true,
      ),
    );
  }

  if (badges.length === 0) {
    if (input.citationCount === null || input.citationCount === undefined) {
      badges.push(
        badge(
          "manual-review-required",
          "Citations were not stored.",
          "Persisted citation rows were not stored for this explanation.",
          true,
        ),
      );
    } else {
      badges.push(
        badge(
          "manual-review-required",
          "Manual review required",
          input.citationCount === 0
            ? "No persisted citations were stored for this explanation."
            : "No persisted citation or support ratio is available for this explanation.",
          true,
        ),
      );
    }
  }

  return badges;
}
