import { cn } from "@/lib/utils";
import { OperatorLoadingNotice, OperatorMalformedCallout } from "@/components/OperatorShellMessage";
import { GraphBuyerEvidenceTrailError } from "@/app/(operator)/insights/evidence-graph/_sections/GraphBuyerEvidenceTrailError";
import { BUYER_GRAPH_LOAD_ERROR } from "@/lib/buyer/buyer-polish-copy";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type GraphFetchStatusAlertsProps = {
  loading: boolean;
  loadFailure: ApiLoadFailureState | null;
  malformedMessage: string | null;
  buyerPolishedShell?: boolean;
  runId?: string;
  onRetry?: () => void;
  graphEndpointHint?: string;
};

export function GraphFetchStatusAlerts(props: GraphFetchStatusAlertsProps) {
  const {
    loading,
    loadFailure,
    malformedMessage,
    buyerPolishedShell = false,
    runId = "",
    onRetry,
    graphEndpointHint,
  } = props;

  return (
    <>
      {loading && (
        <OperatorLoadingNotice>
          <strong>{buyerPolishedShell ? "Loading evidence graph" : "Loading graph"}</strong>
          <p className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>
            {buyerPolishedShell
              ? "Collecting provenance links for this review — rich evidence may take a few extra seconds."
              : "Preparing the graph view — reviews with rich evidence may take a few extra seconds."}
          </p>
        </OperatorLoadingNotice>
      )}

      {loadFailure !== null ? (
        <GraphBuyerEvidenceTrailError
          failure={loadFailure}
          runId={runId}
          loading={loading}
          onRetry={() => onRetry?.()}
          graphEndpointHint={graphEndpointHint}
          operatorShell={!buyerPolishedShell}
        />
      ) : null}

      {malformedMessage && (
        <OperatorMalformedCallout>
          <strong>{buyerPolishedShell ? "Workspace data unavailable" : "Unexpected graph response shape."}</strong>
          <p className="mt-2">{buyerPolishedShell ? BUYER_GRAPH_LOAD_ERROR : malformedMessage}</p>
          {buyerPolishedShell ? null : (
            <p className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>
              The call succeeded but the payload did not match the expected GraphViewModel (nodes and edges arrays).
              Check API version alignment.
            </p>
          )}
        </OperatorMalformedCallout>
      )}
    </>
  );
}
