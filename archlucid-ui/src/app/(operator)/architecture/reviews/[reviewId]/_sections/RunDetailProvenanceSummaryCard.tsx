"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
import { RunDetailEngineProvenanceRow } from "@/components/reviews/RunDetailEngineProvenanceRow";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import type { ReviewRunEngineProvenance } from "@/lib/review-engine-provenance-display";
import {
  deriveReviewRecordMetadataContext,
} from "@/lib/run-detail-workspace-derive";
import { resolveProvenanceMetadataAbsentReasons } from "@/lib/provenance-metadata-absent-reasons";
import type { RunDetail } from "@/types/authority";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  RUN_DETAIL_PROVENANCE_IDENTIFIERS_OPEN_PARAM,
  parseRunDetailProvenanceIdentifiersOpenFromSearch,
  runDetailProvenanceIdentifiersDisclosureHrefFromSearch,
} from "@/lib/runs/run-detail-provenance-identifiers-disclosure-url";

import { runDetailSectionHeadingClass } from "./run-detail-section-heading";

export type RunDetailProvenanceSummaryCardProps = {
  readonly runId: string;
  readonly run: RunDetail["run"];
  readonly engineProvenance?: ReviewRunEngineProvenance | null;
  readonly manifestId?: string | null;
};

/** TB-111: inline provenance context without leaving run detail. */
export function RunDetailProvenanceSummaryCard(props: RunDetailProvenanceSummaryCardProps): ReactElement {
  const { runId, run, engineProvenance, manifestId } = props;
  const architectureRequestId =
    "architectureRequestId" in run && typeof run.architectureRequestId === "string"
      ? run.architectureRequestId
      : null;
  const metadataContext = deriveReviewRecordMetadataContext(manifestId);
  const absentReasons = resolveProvenanceMetadataAbsentReasons(metadataContext);
  const pathname = usePathname() ?? "/";
  const [identifiersOpen, setIdentifiersOpenState] = useState(() =>
    parseRunDetailProvenanceIdentifiersOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get(RUN_DETAIL_PROVENANCE_IDENTIFIERS_OPEN_PARAM),
    ),
  );
  const identifiersOpenRef = useRef(identifiersOpen);
  identifiersOpenRef.current = identifiersOpen;

  const syncIdentifiersOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        runDetailProvenanceIdentifiersDisclosureHrefFromSearch(readWindowLocationSearch(), open, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setIdentifiersOpen = useCallback(
    (open: boolean) => {
      if (identifiersOpenRef.current === open) {
        return;
      }

      identifiersOpenRef.current = open;
      setIdentifiersOpenState(open);
      syncIdentifiersOpenToUrl(open);
    },
    [syncIdentifiersOpenToUrl],
  );

  useEffect(() => {
    const syncIdentifiersOpenFromUrl = (): void => {
      const nextOpen = parseRunDetailProvenanceIdentifiersOpenFromSearch(
        new URLSearchParams(window.location.search).get(RUN_DETAIL_PROVENANCE_IDENTIFIERS_OPEN_PARAM),
      );

      if (identifiersOpenRef.current === nextOpen) {
        return;
      }

      identifiersOpenRef.current = nextOpen;
      setIdentifiersOpenState(nextOpen);
    };

    syncIdentifiersOpenFromUrl();
    window.addEventListener("popstate", syncIdentifiersOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncIdentifiersOpenFromUrl);
    };
  }, []);

  const definitionLabelClass = cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.body);
  const monoValueClass = cn("mt-1 flex items-center gap-2 font-mono", OPERATOR_TYPOGRAPHY.micro);
  const absentValueClass = cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper);

  return (
    <section id="provenance-summary" className="scroll-mt-24">
      <Card>
        <CardHeader>
          <h3 className={runDetailSectionHeadingClass}>Provenance summary</h3>
          <CardDescription>
            Snapshot and request identifiers for this review. Open the full provenance graph for coordinator linkage and
            trace timeline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <CollapsibleSection
            title="Identifiers"
            open={identifiersOpen}
            onToggle={setIdentifiersOpen}
          >
            <dl className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
              <div>
                <dt className={definitionLabelClass}>Context snapshot</dt>
                <dd className={run.contextSnapshotId ? monoValueClass : absentValueClass}>
                  {run.contextSnapshotId ?? absentReasons.contextSnapshot}
                  {run.contextSnapshotId ? (
                    <CopyIdButton value={run.contextSnapshotId} aria-label="Copy context snapshot ID" />
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className={definitionLabelClass}>Graph snapshot</dt>
                <dd className={run.graphSnapshotId ? monoValueClass : absentValueClass}>
                  {run.graphSnapshotId ?? absentReasons.graphSnapshot}
                  {run.graphSnapshotId ? (
                    <CopyIdButton value={run.graphSnapshotId} aria-label="Copy graph snapshot ID" />
                  ) : null}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className={definitionLabelClass}>Architecture request</dt>
                <dd className={architectureRequestId ? monoValueClass : absentValueClass}>
                  {architectureRequestId ?? absentReasons.architectureRequest}
                  {architectureRequestId ? (
                    <CopyIdButton value={architectureRequestId} aria-label="Copy architecture request ID" />
                  ) : null}
                </dd>
              </div>
            </dl>
          </CollapsibleSection>
          {engineProvenance ? <RunDetailEngineProvenanceRow provenance={engineProvenance} /> : null}
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
            <Link
              className={OPERATOR_LINK.nav}
              href={`/architecture/reviews/${encodeURIComponent(runId)}/provenance`}
            >
              View full provenance
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
