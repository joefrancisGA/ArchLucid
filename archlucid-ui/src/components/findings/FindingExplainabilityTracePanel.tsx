"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useEffect, useState } from "react";

import { ExplainabilityTraceTree } from "@/components/explainability/ExplainabilityTraceTree";
import { FindingOptionalArtifactUnavailable } from "@/components/findings/FindingOptionalArtifactUnavailable";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { Progress } from "@/components/ui/progress";
import { getFindingExplainability } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  findingEvidenceCountPlainLine,
  findingTraceCompletenessPlainEnglish,
} from "@/lib/findings/finding-explainability-summary";
import { resolveFindingOptionalArtifactUnavailableCopy } from "@/lib/findings/finding-optional-artifact-copy";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import type { FindingExplainability } from "@/types/explanation";

export type FindingExplainabilityTracePanelProps = {
  readonly runId: string;
  readonly findingId: string;
  readonly buyerPolishedShell?: boolean;
  readonly defaultCollapsed?: boolean;
  readonly graphEvidenceHref?: string | null;
  readonly linkedManifestHref?: string | null;
};

/**
 * Above-the-fold deterministic explainability trace for finding inspect/detail.
 * Complements the LLM audit panel — surfaces persisted pipeline evidence first.
 */
export function FindingExplainabilityTracePanel(props: FindingExplainabilityTracePanelProps): React.JSX.Element {
  const buyerPolishedShell = props.buyerPolishedShell === true;
  const defaultCollapsed = props.defaultCollapsed !== false;
  const sampleReview = isShowcaseStaticDemoRunId(props.runId.trim());
  const [data, setData] = useState<FindingExplainability | null>(null);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const findingId = props.findingId.trim();
    const runId = props.runId.trim();

    if (findingId.length === 0 || runId.length === 0) {
      return;
    }

    setLoading(true);
    setFailure(null);
    setData(null);

    try {
      const body = await getFindingExplainability(runId, findingId);
      setData(body);
    } catch (err) {
      setFailure(toApiLoadFailure(err));
    } finally {
      setLoading(false);
    }
  }, [props.findingId, props.runId]);

  useEffect(() => {
    void load();
  }, [load]);

  const ratioPct =
    data !== null && Number.isFinite(data.traceCompletenessRatio)
      ? Math.round(Math.min(1, Math.max(0, data.traceCompletenessRatio)) * 100)
      : 0;

  const evidenceRefs = data?.evidence?.evidenceRefs ?? [];
  const unavailableCopy =
    failure !== null
      ? resolveFindingOptionalArtifactUnavailableCopy("explainability-trace", failure, {
          buyerPolishedShell,
          sampleReview,
        })
      : null;
  const recoveryLinks = [
    ...(props.graphEvidenceHref !== null && props.graphEvidenceHref !== undefined
      ? [{ href: props.graphEvidenceHref, label: "Open evidence graph" }]
      : []),
    ...(props.linkedManifestHref !== null && props.linkedManifestHref !== undefined
      ? [{ href: props.linkedManifestHref, label: "Open sealed review record" }]
      : []),
  ];

  const panelBody = (
    <>
      {loading ? (
        <div className="mt-3">
          <OperatorLoadingNotice>
            <strong>Loading explainability trace…</strong>
          </OperatorLoadingNotice>
        </div>
      ) : null}

      {failure !== null && unavailableCopy !== null ? (
        <div className="mt-3">
          <FindingOptionalArtifactUnavailable
            heading={unavailableCopy.heading}
            body={unavailableCopy.body}
            tryNext={unavailableCopy.tryNext}
            showRetry={unavailableCopy.showRetry}
            onRetry={() => {
              void load();
            }}
            loading={loading}
            recoveryLinks={recoveryLinks}
            failure={failure}
            buyerPolishedShell={buyerPolishedShell}
          />
        </div>
      ) : null}

      {!loading && failure === null && data !== null ? (
        <div className="mt-4 space-y-3">
          <div className="space-y-2">
            <div className={cn("flex items-center justify-between gap-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              <span>{findingTraceCompletenessPlainEnglish(ratioPct)}</span>
              <span>{ratioPct}%</span>
            </div>
            <Progress value={ratioPct} aria-label="Trace completeness" />
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {findingEvidenceCountPlainLine(evidenceRefs)}
            </p>
          </div>
          <ExplainabilityTraceTree data={data} />
        </div>
      ) : null}
    </>
  );

  if (defaultCollapsed) {
    return (
      <CollapsibleSection
        title="Explainability"
        defaultOpen={false}
        sectionTestId="finding-explainability-trace-collapsible"
        summaryLine={
          failure !== null
            ? unavailableCopy?.body ?? "Explainability trace unavailable."
            : data !== null
              ? findingTraceCompletenessPlainEnglish(ratioPct)
              : "Deterministic pipeline evidence for this finding."
        }
      >
        <div data-testid="finding-explainability-trace-panel">{panelBody}</div>
      </CollapsibleSection>
    );
  }

  return (
    <section
      className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/40"
      aria-labelledby="finding-explainability-trace-heading"
      data-testid="finding-explainability-trace-panel"
    >
      <div className="space-y-1">
        <h2
          id="finding-explainability-trace-heading"
          className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          Explainability trace
        </h2>
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Deterministic pipeline evidence — rules applied, citations, and trace completeness before external model audit.
        </p>
      </div>
      {panelBody}
    </section>
  );
}
