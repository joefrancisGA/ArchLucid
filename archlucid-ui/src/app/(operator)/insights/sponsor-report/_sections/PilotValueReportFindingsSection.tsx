"use client";

import Link from "next/link";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { InlineMetadataLabel } from "@/components/InlineMetadataLabel";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatPilotOutcomesAnalysisCoverage } from "@/lib/pilot-outcomes-agent-type-labels";
import { cn } from "@/lib/utils";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

import { SponsorReportNextReviewFooterClient } from "./SponsorReportNextReviewFooterClient";

function formatReviewDate(iso: string | null): string {
  if (iso === null || iso.length === 0) {
    return "Not available";
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

type Props = {
  readonly data: PilotValueReportJson;
  readonly scopedRunFilterActive: boolean;
  readonly scopedRunId: string;
};

export function PilotValueReportFindingsSection(props: Props) {
  const { data, scopedRunFilterActive, scopedRunId } = props;
  const timelineRows = data.committedRunsTimeline ?? [];
  const showTimelineCapNote = data.runDetailsTruncated === true && (data.runDetailCap ?? 0) > 0;

  return (
    <>
      <section className="grid gap-4 lg:grid-cols-2" aria-labelledby="governance-outcomes-heading">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 id="governance-outcomes-heading" className={cn("mt-0", OPERATOR_NAV_GROUP_LABEL)}>
            Governance outcomes
          </h2>
          <h3 className={cn("mb-2", OPERATOR_TYPOGRAPHY.helper)}>Decisions</h3>
          <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
            <li>
              <InlineMetadataLabel label="Approved" /> {data.governanceApprovals}
            </li>
            <li>
              <InlineMetadataLabel label="Rejected" /> {data.governanceRejections}
            </li>
            <li>
              <InlineMetadataLabel label="Pending" /> {data.governancePendingApprovalsNow}
            </li>
          </ul>
          <h3 className={cn("mb-2 mt-4", OPERATOR_TYPOGRAPHY.helper)}>Policy governance</h3>
          <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
            <li>
              <InlineMetadataLabel label="Policy packs applied" /> {data.policyPackAssignments}
            </li>
            <li>
              <InlineMetadataLabel label="Exceptions or waivers" /> Not available
            </li>
          </ul>
          <h3 className={cn("mb-2 mt-4", OPERATOR_TYPOGRAPHY.helper)}>Architecture-change signals</h3>
          <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
            <li>
              <InlineMetadataLabel label="Drift detections" /> {data.comparisonOrDriftDetections}
            </li>
          </ul>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className={cn("mt-0", OPERATOR_NAV_GROUP_LABEL)}>Recommendations and remediation</h2>
          <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
            <li>
              <InlineMetadataLabel label="Recommendations generated" /> {data.totalRecommendationsProduced}
            </li>
            <li>
              <InlineMetadataLabel label="Recommendations accepted" /> Not available
            </li>
            <li>
              <InlineMetadataLabel label="Remediation assignments" /> Not available
            </li>
            <li>
              <InlineMetadataLabel label="Findings remediated" /> Not available
            </li>
          </ul>
          <h2 className={cn("mb-2 mt-6", OPERATOR_NAV_GROUP_LABEL)}>Analysis coverage</h2>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
            {formatPilotOutcomesAnalysisCoverage(data.uniqueAgentTypes)}
          </p>
          <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Shows which ArchLucid analysis capabilities contributed evidence to this report.
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className={cn("mt-0", OPERATOR_NAV_GROUP_LABEL)}>Finalized reviews</h2>
        {showTimelineCapNote ? (
          <p className={cn("m-0 mb-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Showing the most recent {timelineRows.length} finalized reviews.
            <Link href="/architecture/reviews" className={cn(OPERATOR_LINK.inline, "ml-1")}>
              View all qualifying reviews
            </Link>
          </p>
        ) : null}
        <EnterpriseTable ariaLabel="Finalized reviews in pilot value report" className={cn("min-w-full text-left", OPERATOR_TYPOGRAPHY.body)}>
          <EnterpriseTableHead className={cn("border-b border-neutral-200 dark:border-neutral-800", OPERATOR_NAV_GROUP_LABEL)}>
            <EnterpriseTableHeadRow>
              <EnterpriseTableHeaderCell scope="col" className="py-2 pr-3">
                Review
              </EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell scope="col" className="py-2 pr-3">
                System
              </EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell scope="col" className="py-2 pr-3">
                Created
              </EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell scope="col" className="py-2 pr-3">
                Finalized
              </EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell scope="col" className="py-2 pr-3">
                Outcome
              </EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell scope="col" className="py-2 pr-3">
                Highest severity
              </EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell scope="col" className="py-2 pr-3">
                Open actions
              </EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell scope="col" className="py-2">
                Link
              </EnterpriseTableHeaderCell>
            </EnterpriseTableHeadRow>
          </EnterpriseTableHead>
          <EnterpriseTableBody>
            {timelineRows.map((row) => (
              <EnterpriseTableRow key={row.runId}>
                <EnterpriseTableCell className={cn("py-2 pr-3", OPERATOR_TYPOGRAPHY.body)}>{row.systemName || row.runId}</EnterpriseTableCell>
                <EnterpriseTableCell className={cn("py-2 pr-3", OPERATOR_TYPOGRAPHY.helper)}>{row.systemName || " — "}</EnterpriseTableCell>
                <EnterpriseTableCell className={cn("py-2 pr-3", OPERATOR_TYPOGRAPHY.helper)}>{formatReviewDate(row.createdUtc)}</EnterpriseTableCell>
                <EnterpriseTableCell className={cn("py-2 pr-3", OPERATOR_TYPOGRAPHY.helper)}>
                  {formatReviewDate(row.committedUtc)}
                </EnterpriseTableCell>
                <EnterpriseTableCell className={cn("py-2 pr-3", OPERATOR_TYPOGRAPHY.helper)}>Not available</EnterpriseTableCell>
                <EnterpriseTableCell className={cn("py-2 pr-3", OPERATOR_TYPOGRAPHY.helper)}>Not available</EnterpriseTableCell>
                <EnterpriseTableCell className={cn("py-2 pr-3", OPERATOR_TYPOGRAPHY.helper)}>Not available</EnterpriseTableCell>
                <EnterpriseTableCell className={cn("py-2", OPERATOR_TYPOGRAPHY.helper)}>
                  <Link href={`/architecture/reviews/${encodeURIComponent(row.runId)}`} className={OPERATOR_LINK.inline}>
                    Open review
                  </Link>
                </EnterpriseTableCell>
              </EnterpriseTableRow>
            ))}
          </EnterpriseTableBody>
        </EnterpriseTable>
      </section>

      <CollapsibleSection title="Technical details" defaultOpen={false} sectionTestId="pilot-outcomes-technical-details">
        <ul className={cn("m-0 list-disc pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <li>Reporting period end timestamp is exclusive (UTC).</li>
          <li>Recommendations generated are counted from audit events in the selected window.</li>
          <li>Review completion time reflects pipeline duration for finalized reviews in the detail sample.</li>
        </ul>
      </CollapsibleSection>

      {scopedRunFilterActive ? (
        <SponsorReportNextReviewFooterClient runId={scopedRunId} />
      ) : null}
    </>
  );
}
