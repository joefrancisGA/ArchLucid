"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { getShowcaseWalkthroughHref } from "@/lib/buyer-safe-review-navigation";

import { OperatorEmptyState } from "@/components/OperatorShellMessage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { formatInstantForBuyerGovernance } from "@/lib/locale-datetime";
import {
  formatGovernanceLineageCompletenessPercent,
  formatGovernanceLineageWholeCount,
} from "@/lib/governance-lineage-metric-format";
import type { GovernanceLineageResult } from "@/types/governance-dashboard";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { ApprovalLineageEvidenceOrientationStrip } from "./ApprovalLineageEvidenceOrientationStrip";
import { governanceLineageApprovalDisplayTitle } from "./governance-lineage-approval-display-title";

type GovernanceApprovalLineageDetailContentProps = {
  data: GovernanceLineageResult;
};

export function GovernanceApprovalLineageDetailContent({ data }: GovernanceApprovalLineageDetailContentProps) {
  const a = data.approvalRequest;
  const displayApprovalTitle = governanceLineageApprovalDisplayTitle(a.requestComment);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Approval lineage</h1>
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{displayApprovalTitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PageContextualHelpButton />
          {/* Returns to the curated showcase walkthrough, not the breadcrumb parent (approval request detail). */}
          <Button variant="outline" size="sm" asChild>
            <Link href={getShowcaseWalkthroughHref()}>Back to governance approval</Link>
          </Button>
        </div>
      </div>

      <ApprovalLineageEvidenceOrientationStrip />

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Approval</CardTitle>
          <CardDescription>Status and reviewer context</CardDescription>
        </CardHeader>
        <CardContent className={cn("grid gap-2", OPERATOR_TYPOGRAPHY.body)}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Status</span>
            <Badge variant="secondary">{a.status}</Badge>
            {data.riskPosture ? (
              <>
                <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Risk posture</span>
                <Badge variant="outline">{data.riskPosture}</Badge>
              </>
            ) : null}
          </div>
          <div>
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Review</span>{" "}
            <Link
              className={OPERATOR_LINK.inline}
              href={`/architecture/reviews/${encodeURIComponent(a.runId)}`}
            >
              Open →
            </Link>
            <span className="sr-only"> ({a.runId})</span>
          </div>
          <div>
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Signed review record version</span>{" "}
            <span className={cn("font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{a.manifestVersion}</span>
          </div>
          <div className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Requested {formatInstantForBuyerGovernance(a.requestedUtc)} by {a.requestedBy}
            {a.reviewedUtc ? (
              <>
                {" "}
                · Reviewed {formatInstantForBuyerGovernance(a.reviewedUtc)}
                {a.reviewedBy ? ` by ${a.reviewedBy}` : ""}
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {data.run ? (
        <Card>
          <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Architecture review checkpoint</CardTitle>
          <CardDescription>Status and completion record</CardDescription>
          </CardHeader>
          <CardContent className={OPERATOR_TYPOGRAPHY.body}>
            <div>Status {data.run.status}</div>
            <div>Created {formatInstantForBuyerGovernance(data.run.createdUtc)}</div>
            {data.run.completedUtc ? (
              <div>Completed {formatInstantForBuyerGovernance(data.run.completedUtc)}</div>
            ) : null}
            {data.run.currentManifestVersion ? (
              <div>Current review version {data.run.currentManifestVersion}</div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {data.manifest ? (
        <Card>
          <CardHeader>
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Signed review record</CardTitle>
            <CardDescription>Signed review record associated with this approval</CardDescription>
          </CardHeader>
          <CardContent className={cn("grid gap-1", OPERATOR_TYPOGRAPHY.body)}>
            <div>Version {data.manifest.manifestVersion ?? "—"}</div>
            <div>Decisions {formatGovernanceLineageWholeCount(data.manifest.decisionCount)}</div>
            <div>Unresolved issues {formatGovernanceLineageWholeCount(data.manifest.unresolvedIssueCount)}</div>
            <div>Unresolved findings {formatGovernanceLineageWholeCount(data.manifest.unresolvedIssueCount)}</div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Top findings</CardTitle>
          <CardDescription>Findings associated with this approval</CardDescription>
        </CardHeader>
        <CardContent>
          {data.topFindings.length === 0 ? (
            <OperatorEmptyState title="No findings in lineage">
              <p className={OPERATOR_TYPOGRAPHY.body}>
                Findings appear when this approval links to a review that has a findings snapshot.
              </p>
            </OperatorEmptyState>
          ) : (
            <ul className={cn("space-y-2", OPERATOR_TYPOGRAPHY.body)}>
              {data.topFindings.map((f) => (
                <li key={f.findingId} className="rounded-md border p-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{f.severity}</Badge>
                    <span className="font-medium">{f.title}</span>
                  </div>
                  <div className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                    {f.engineType} · trace completeness {formatGovernanceLineageCompletenessPercent(f.traceCompletenessRatio)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Promotions</CardTitle>
          <CardDescription>Recorded promotion history for this review</CardDescription>
        </CardHeader>
        <CardContent>
          {data.promotions.length === 0 ? (
            <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No promotion records.</p>
          ) : (
            <ul className={cn("space-y-2", OPERATOR_TYPOGRAPHY.body)}>
              {data.promotions.map((p) => (
                <li key={p.promotionRecordId} className="rounded-md border p-2">
                  <div className="font-medium">
                    Signed review record <span className="font-mono">{p.manifestVersion}</span>
                  </div>
                  <div className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                    {formatInstantForBuyerGovernance(p.promotedUtc)} · {p.promotedBy}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Separator />
    </div>
  );
}
