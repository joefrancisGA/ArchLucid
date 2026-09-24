import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { isApiNotFoundFailure, type ApiLoadFailureState } from "@/lib/api-load-failure";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { formatInstantInPreferredTimeZone } from "@/lib/locale-datetime";
import { isLiveAuthorityRunId, shouldSkipLiveAuthorityRunScopedApi } from "@/lib/operator-static-demo/run-scoped-live-api";
import { isUuidLike } from "@/lib/resolve-governance-finding-resource-group";
import { SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

export type DiagramReconcileSealedReviewRecordState =
  | { readonly kind: "idle" }
  | { readonly kind: "invalid-id" }
  | { readonly kind: "loading" }
  | { readonly kind: "not-found"; readonly message: string }
  | { readonly kind: "blocked"; readonly message: string }
  | {
    readonly kind: "loaded";
    readonly reviewTitle: string;
    readonly sealStatusLabel: string;
    readonly sealStatusKind: EnterpriseStatusKind;
    readonly sealDateLabel: string | null;
    readonly runId: string;
    readonly isSealed: boolean;
  };

export function isDiagramReconcileRunIdInputValid(value: string): boolean {
  const trimmed = value.trim();

  return trimmed.length > 0 && isUuidLike(trimmed) && isLiveAuthorityRunId(trimmed);
}

export function resolveDiagramReconcileSealedReviewRecordFromSummary(input: {
  readonly runId: string;
  readonly summary: RunSummary | undefined;
  readonly failure: ApiLoadFailureState | null;
  readonly blockedReason: string | null;
  readonly isLoading: boolean;
}): DiagramReconcileSealedReviewRecordState {
  const trimmed = input.runId.trim();

  if (trimmed.length === 0) {
    return { kind: "idle" };
  }

  if (!isUuidLike(trimmed) || !isLiveAuthorityRunId(trimmed)) {
    return { kind: "invalid-id" };
  }

  if (shouldSkipLiveAuthorityRunScopedApi(trimmed)) {
    return {
      kind: "loaded",
      reviewTitle: SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
      sealStatusLabel: "Sealed",
      sealStatusKind: "ready",
      sealDateLabel: null,
      runId: trimmed,
      isSealed: true,
    };
  }

  if (input.isLoading) {
    return { kind: "loading" };
  }

  if (input.failure !== null) {
    if (isApiNotFoundFailure(input.failure)) {
      return {
        kind: "not-found",
        message: "Sealed review record not found for this ID.",
      };
    }

    if (input.blockedReason !== null) {
      return { kind: "blocked", message: input.blockedReason };
    }

    return { kind: "blocked", message: input.failure.message };
  }

  if (input.summary === undefined) {
    return { kind: "loading" };
  }

  const isSealed = input.summary.hasGoldenManifest === true;
  const completedUtc = input.summary.completedUtc?.trim() ?? "";
  const sealDateLabel =
    completedUtc.length > 0 ? formatInstantInPreferredTimeZone(completedUtc) : null;

  return {
    kind: "loaded",
    reviewTitle: buyerFacingReviewTitleFromSummary(input.summary),
    sealStatusLabel: isSealed ? "Sealed" : "Draft",
    sealStatusKind: isSealed ? "ready" : "needs-attention",
    sealDateLabel,
    runId: trimmed,
    isSealed,
  };
}

export function diagramReconcileMutationsAllowed(
  sealedRecord: DiagramReconcileSealedReviewRecordState,
): boolean {
  return sealedRecord.kind === "loaded" && sealedRecord.isSealed;
}
