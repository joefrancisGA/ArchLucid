import type { OperatorEvidenceLimitsExecutionProps } from "@/components/OperatorEvidenceLimitsFooter";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { FindingInspectPayload } from "@/types/finding-inspect";

/** Preloaded data for {@link FindingDetailPageView} after inspect load succeeds for the route. */
export type FindingDetailPageModel = {
  readonly runId: string;
  /** Raw `findingId` route segment (passed through to audit correlation UI). */
  readonly findingIdRouteParam: string;
  readonly decodedFindingId: string;
  readonly inspectPayload: FindingInspectPayload | null;
  readonly inspectFailure: ApiLoadFailureState | null;
  readonly buyerPolishedShell: boolean;
  readonly linkedManifestHref: string | null;
  readonly pageTitle: string;
  readonly findingIsPhi: boolean;
  readonly runExecutionFootnote: OperatorEvidenceLimitsExecutionProps | null;
};
