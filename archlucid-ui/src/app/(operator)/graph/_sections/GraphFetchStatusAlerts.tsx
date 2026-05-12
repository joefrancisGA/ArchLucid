import Link from "next/link";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorLoadingNotice, OperatorMalformedCallout, OperatorTryNext } from "@/components/OperatorShellMessage";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";

export type GraphFetchStatusAlertsProps = {
  loading: boolean;
  loadFailure: ApiLoadFailureState | null;
  malformedMessage: string | null;
};

export function GraphFetchStatusAlerts(props: GraphFetchStatusAlertsProps) {
  const { loading, loadFailure, malformedMessage } = props;

  return (
    <>
      {loading && (
        <OperatorLoadingNotice>
          <strong>Loading graph</strong>
          <p className="mt-2 text-sm">
            Preparing the graph view — reviews with rich evidence may take a few extra seconds.
          </p>
        </OperatorLoadingNotice>
      )}

      {loadFailure !== null && (
        <>
          <OperatorApiProblem failure={loadFailure} />
          <OperatorTryNext>
            This is usually a network, proxy, or HTTP error from the graph endpoint—not a malformed JSON body. Confirm the
            review exists in <Link href="/reviews?projectId=default">Reviews</Link>, retry the graph action above, and
            check the browser network tab for the failing <code>/v1/…/graph</code> call.
          </OperatorTryNext>
        </>
      )}

      {malformedMessage && (
        <>
          <OperatorMalformedCallout>
            <strong>Unexpected graph response shape.</strong>
            <p className="mt-2">{malformedMessage}</p>
            <p className="mt-2 text-sm">
              The call succeeded but the payload did not match the expected GraphViewModel (nodes and edges arrays).
              Check API version alignment.
            </p>
          </OperatorMalformedCallout>
          <OperatorTryNext>
            Compare <code>GET /version</code> on the API with your UI deployment. Try another review from{" "}
            <Link href="/reviews?projectId=default">Reviews</Link> if this review has partial graph data.
          </OperatorTryNext>
        </>
      )}
    </>
  );
}
