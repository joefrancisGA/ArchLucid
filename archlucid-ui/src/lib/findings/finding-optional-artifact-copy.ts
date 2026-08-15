import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import {
  isApiNotFoundFailure,
  isApiTransientLoadFailure,
  resolveApiLoadFailurePresentation,
} from "@/lib/api-load-failure";

export type FindingOptionalArtifactKind = "explainability-trace" | "audit-record" | "evidence-chain";

export type FindingOptionalArtifactUnavailableCopy = {
  readonly heading: string;
  readonly body: string;
  readonly tryNext: string | null;
  readonly showRetry: boolean;
};

export function resolveFindingOptionalArtifactUnavailableCopy(
  kind: FindingOptionalArtifactKind,
  failure: ApiLoadFailureState | null | undefined,
  options?: { readonly buyerPolishedShell?: boolean; readonly sampleReview?: boolean },
): FindingOptionalArtifactUnavailableCopy {
  const buyerPolishedShell = options?.buyerPolishedShell === true;
  const sampleReview = options?.sampleReview === true;
  const presentation = resolveApiLoadFailurePresentation(failure);

  if (presentation === "not-found") {
    if (kind === "explainability-trace") {
      return {
        heading: "Explainability trace unavailable",
        body: sampleReview || buyerPolishedShell
          ? "This explainability trace is unavailable for this sample review."
          : "Explainability was not generated for this review.",
        tryNext: "Open the evidence graph or sealed review record for persisted citations.",
        showRetry: false,
      };
    }

    if (kind === "audit-record") {
      return {
        heading: "Audit record unavailable",
        body: sampleReview || buyerPolishedShell
          ? "A related audit record was not published for this sample finding."
          : "No audit record is attached to this finding.",
        tryNext: "Use the evidence graph and sealed review record for the authoritative trail.",
        showRetry: false,
      };
    }

    return {
      heading: "Evidence chain unavailable",
      body: "Supporting evidence pointers are not available for this finding.",
      tryNext: "Review linked evidence citations in the finding summary above.",
      showRetry: false,
    };
  }

  if (presentation === "transient" || isApiTransientLoadFailure(failure)) {
    return {
      heading: kind === "explainability-trace" ? "Explainability trace temporarily unavailable" : "Related record temporarily unavailable",
      body: "ArchLucid could not load this optional artifact right now. Your finding summary and evidence links remain available.",
      tryNext: "Retry in a moment, or continue from the evidence graph and sealed review record.",
      showRetry: true,
    };
  }

  if (isApiNotFoundFailure(failure)) {
    return resolveFindingOptionalArtifactUnavailableCopy(kind, failure, {
      ...options,
      buyerPolishedShell: true,
    });
  }

  if (kind === "explainability-trace") {
    return {
      heading: "Explainability trace unavailable",
      body: buyerPolishedShell
        ? "Explainability was not generated for this review."
        : "Explainability trace data is not available for this finding.",
      tryNext: "Use the evidence graph and sealed review record for review-grade traceability.",
      showRetry: true,
    };
  }

  return {
    heading: "Related record unavailable",
    body: "This optional supporting record could not be loaded.",
    tryNext: "Continue from the finding summary and evidence graph.",
    showRetry: true,
  };
}
