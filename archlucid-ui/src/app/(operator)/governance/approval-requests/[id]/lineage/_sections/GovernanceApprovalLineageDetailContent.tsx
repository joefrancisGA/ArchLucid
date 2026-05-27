"use client";

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
import { formatIsoUtcForDisplay } from "@/lib/format-iso-utc";
import {
  formatGovernanceLineageCompletenessPercent,
  formatGovernanceLineageWholeCount,
} from "@/lib/governance-lineage-metric-format";
import type { GovernanceLineageResult } from "@/types/governance-dashboard";

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
          <h1 className="text-2xl font-semibold tracking-tight">Approval lineage</h1>
          <p className="text-sm text-muted-foreground">{displayApprovalTitle}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={getShowcaseWalkthroughHref()}>Back to governance approval</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approval</CardTitle>
          <CardDescription>Status and reviewer context</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="secondary">{a.status}</Badge>
            {data.riskPosture ? (
              <>
                <span className="text-muted-foreground">Risk posture</span>
                <Badge variant="outline">{data.riskPosture}</Badge>
              </>
            ) : null}
          </div>
          <div>
            <span className="text-muted-foreground">Review</span>{" "}
            <Link
              className="font-medium underline-offset-4 hover:underline"
              href={`/reviews/${encodeURIComponent(a.runId)}`}
            >
              Open review
            </Link>
            <span className="sr-only"> ({a.runId})</span>
          </div>
          <div>
            Manifest <span className="font-mono">{a.manifestVersion}</span> · {a.sourceEnvironment} →{" "}
            {a.targetEnvironment}
          </div>
          <div className="text-muted-foreground">
            Requested {formatIsoUtcForDisplay(a.requestedUtc)} by {a.requestedBy}
            {a.reviewedUtc ? (
              <>
                {" "}
                · Reviewed {formatIsoUtcForDisplay(a.reviewedUtc)}
                {a.reviewedBy ? ` by ${a.reviewedBy}` : ""}
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {data.run ? (
        <Card>
          <CardHeader>
            <CardTitle>Review pipeline checkpoint</CardTitle>
            <CardDescription>Architecture review summary</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <div>Status {data.run.status}</div>
            <div>Created {formatIsoUtcForDisplay(data.run.createdUtc)}</div>
            {data.run.completedUtc ? (
              <div>Completed {formatIsoUtcForDisplay(data.run.completedUtc)}</div>
            ) : null}
            {data.run.currentManifestVersion ? (
              <div>Current manifest {data.run.currentManifestVersion}</div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {data.manifest ? (
        <Card>
          <CardHeader>
            <CardTitle>Reviewed manifest</CardTitle>
            <CardDescription>When the review id maps to a finalized manifest in scope</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-1 text-sm">
            <div>Version {data.manifest.manifestVersion ?? "—"}</div>
            <div>Decisions {formatGovernanceLineageWholeCount(data.manifest.decisionCount)}</div>
            <div>Unresolved issues {formatGovernanceLineageWholeCount(data.manifest.unresolvedIssueCount)}</div>
            <div>Unresolved findings {formatGovernanceLineageWholeCount(data.manifest.unresolvedIssueCount)}</div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Top findings</CardTitle>
          <CardDescription>Up to ten by severity when a findings snapshot exists</CardDescription>
        </CardHeader>
        <CardContent>
          {data.topFindings.length === 0 ? (
            <OperatorEmptyState title="No findings in lineage">
              <p className="text-sm">
                Findings appear when this approval links to a review that has a findings snapshot.
              </p>
            </OperatorEmptyState>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.topFindings.map((f) => (
                <li key={f.findingId} className="rounded-md border p-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{f.severity}</Badge>
                    <span className="font-medium">{f.title}</span>
                  </div>
                  <div className="text-muted-foreground text-xs">
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
          <CardTitle>Promotions</CardTitle>
          <CardDescription>Recorded promotion history for this review</CardDescription>
        </CardHeader>
        <CardContent>
          {data.promotions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No promotion records.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.promotions.map((p) => (
                <li key={p.promotionRecordId} className="rounded-md border p-2">
                  <div>
                    {p.sourceEnvironment} → {p.targetEnvironment} · {p.manifestVersion}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {formatIsoUtcForDisplay(p.promotedUtc)} · {p.promotedBy}
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
