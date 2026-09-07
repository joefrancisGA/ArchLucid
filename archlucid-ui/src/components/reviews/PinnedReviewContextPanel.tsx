"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { InspectorPanel } from "@/components/InspectorPanel";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { getFindingInspect } from "@/lib/api/findings-api";
import { resolveArchitectureReviewHref } from "@/lib/architecture/architecture-routes";
import { resolveReviewWorkspaceArchitectureId } from "@/lib/architecture/working-architecture-review-routes";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { UsePinnedReviewContextResult } from "@/hooks/use-pinned-review-context";
import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

export type PinnedReviewContextPanelProps = {
  readonly primaryRunId: string;
  readonly context: UsePinnedReviewContextResult;
};

function PinnedReviewFindingInspect({
  runId,
  findingId,
  findingTitle,
  onBack,
}: {
  readonly runId: string;
  readonly findingId: string;
  readonly findingTitle: string;
  readonly onBack: () => void;
}): React.JSX.Element {
  const [body, setBody] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void getFindingInspect(runId, findingId, { includeTypedPayload: false })
      .then((payload) => {
        if (cancelled) {
          return;
        }

        const reasoning = (payload.reasoningSummary ?? "").trim();
        const actions = (payload.recommendedActions ?? []).map((action) => action.trim()).filter((action) => action.length > 0);
        const combined =
          reasoning.length > 0
            ? reasoning
            : actions.length > 0
              ? actions.join("\n")
              : (payload.trustLabelReason ?? "").trim();

        setBody(combined);
      })
      .catch((e: unknown) => {
        if (cancelled) {
          return;
        }

        setError(e instanceof Error ? e.message : "Could not load finding inspect.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [findingId, runId]);

  return (
    <div className="space-y-3" data-testid="pinned-review-finding-inspect">
      <Button type="button" variant="outline" size="sm" onClick={onBack}>
        Back to findings list
      </Button>
      {loading ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Loading finding…</p>
      ) : null}
      {error !== null ? (
        <p className={cn("m-0 text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.helper)} role="alert">
          {error}
        </p>
      ) : null}
      {!loading && error === null ? (
        <>
          <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>{findingTitle}</h3>
          <p className={cn("m-0 whitespace-pre-wrap text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {body !== null && body.length > 0 ? body : "No inspect summary on this finding."}
          </p>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Read-only pin context. Open this review as primary to edit dispositions.
          </p>
        </>
      ) : null}
    </div>
  );
}

function PinnedReviewFindingsList({
  findings,
  onInspect,
}: {
  readonly findings: readonly GovernanceFindingQueueRow[];
  readonly onInspect: (findingId: string) => void;
}): React.JSX.Element {
  if (findings.length === 0) {
    return (
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="pinned-review-findings-empty">
        No findings loaded for this pinned review yet.
      </p>
    );
  }

  return (
    <ul className="m-0 list-none space-y-2 p-0" data-testid="pinned-review-findings-list">
      {findings.map((finding) => (
        <li key={finding.findingId}>
          <button
            type="button"
            className={cn(
              "w-full rounded-md border border-neutral-200 px-3 py-2 text-left hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900",
              OPERATOR_TYPOGRAPHY.body,
            )}
            data-testid={`pinned-review-finding-${finding.findingId}`}
            onClick={() => {
              onInspect(finding.findingId);
            }}
          >
            <span className="font-medium text-al-text-primary">{finding.title}</span>
            <span className={cn("mt-1 block text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Open in this pane
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** DR-11 — read-only secondary review context docked beside the primary workspace. */
export function PinnedReviewContextPanel(props: PinnedReviewContextPanelProps): React.JSX.Element {
  const { context, primaryRunId } = props;
  const pathname = usePathname() ?? "";
  const [inspectFindingId, setInspectFindingId] = useState<string | null>(null);
  const pinRunId = context.pinRunId ?? "";
  const headline =
    context.summary !== null ? buyerFacingReviewTitleFromSummary(context.summary) : "Pinned review";

  const architectureId = resolveReviewWorkspaceArchitectureId(
    context.summary?.architectureId ?? null,
    pathname,
  );
  const makePrimaryHref = resolveArchitectureReviewHref(pinRunId, architectureId);

  return (
    <InspectorPanel
      title={headline}
      onClose={context.closePin}
      widthClassName="w-[22rem] max-w-[40vw]"
      className="shrink-0"
      listenEscape
    >
      <div className="space-y-4" data-testid="pinned-review-context-panel">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Secondary context — read-only unless you make it primary.
        </p>

        {context.loading ? (
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="pinned-review-loading">
            Loading pinned review…
          </p>
        ) : null}

        {context.stampStatusLine !== null ? (
          <div className="flex flex-wrap items-center gap-2" data-testid="pinned-review-stamp-status">
            <StatusTag kind={context.summary?.hasGoldenManifest === true ? "approved" : "in-progress"} label={context.stampStatusLine} />
          </div>
        ) : null}

        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="pinned-review-findings-count">
          <span className="font-medium text-al-text-primary">
            {context.findingsCount ?? "—"}
          </span>
          {" "}
          assessment finding{(context.findingsCount ?? 0) === 1 ? "" : "s"}
        </p>

        {inspectFindingId !== null && pinRunId.length > 0 ? (
          <PinnedReviewFindingInspect
            runId={pinRunId}
            findingId={inspectFindingId}
            findingTitle={
              context.findings.find((row) => row.findingId === inspectFindingId)?.title ?? inspectFindingId
            }
            onBack={() => {
              setInspectFindingId(null);
            }}
          />
        ) : (
          <PinnedReviewFindingsList
            findings={context.findings}
            onInspect={(findingId) => {
              setInspectFindingId(findingId);
            }}
          />
        )}

        <div className="flex flex-col gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-700">
          <Button type="button" variant="primary" size="sm" asChild data-testid="pinned-review-make-primary">
            <Link href={makePrimaryHref}>Make primary review</Link>
          </Button>
          <Button type="button" variant="outline" size="sm" asChild data-testid="pinned-review-open-full">
            <Link href={makePrimaryHref} className={OPERATOR_LINK.nav}>
              Open full review
            </Link>
          </Button>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Primary review: <span className="font-mono text-xs">{primaryRunId}</span>
          </p>
        </div>
      </div>
    </InspectorPanel>
  );
}
