"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { ApprovalLineageQueueVocabularyRail } from "@/components/ApprovalLineageQueueVocabularyRail";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Separator } from "@/components/ui/separator";
import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/ui/status-tag";
import {
  PAGE_HELP_SHORT_TRIGGER_TEXT,
  PageContextualHelpButton,
} from "@/components/usability/PageContextualHelpButton";
import { SelfDescribingMetricCount } from "@/components/usability/SelfDescribingMetricCount";
import { getFindingDetailHref } from "@/lib/findings/finding-evidence-navigation";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";
import {
  buildGovernanceLineageManifestMetricFields,
  governanceApprovalRequestParentHref,
  governanceApprovalStatusTagPresentation,
  governanceLineageVerificationStatusTagPresentation,
  governanceRiskPostureStatusTagPresentation,
} from "@/lib/governance/governance-lineage-presentation";
import { formatInstantForBuyerGovernance } from "@/lib/locale-datetime";
import { formatGovernanceLineageCompletenessPercent } from "@/lib/governance/governance-lineage-metric-format";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GOVERNANCE_APPROVAL_LINEAGE_FINDINGS_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import type { GovernanceLineageResult } from "@/types/governance-dashboard";

import { GovernanceApprovalLineageSpine } from "./GovernanceApprovalLineageSpine";
import { governanceLineageApprovalDisplayTitle } from "./governance-lineage-approval-display-title";

type GovernanceApprovalLineageDetailContentProps = {
  data: GovernanceLineageResult;
};

export function GovernanceApprovalLineageDetailContent({ data }: GovernanceApprovalLineageDetailContentProps) {
  const a = data.approvalRequest;
  const displayApprovalTitle = governanceLineageApprovalDisplayTitle(a.requestComment);
  const approvalStatus = governanceApprovalStatusTagPresentation(a.status);
  const riskPostureStatus = data.riskPosture
    ? governanceRiskPostureStatusTagPresentation(data.riskPosture)
    : null;
  const approvalParentHref = governanceApprovalRequestParentHref(a.runId);
  const reviewHref = `/architecture/reviews/${encodeURIComponent(a.runId)}`;
  const manifestMetricFields = data.manifest
    ? buildGovernanceLineageManifestMetricFields({ manifest: data.manifest, runId: a.runId })
    : [];
  const verificationStatus = data.manifest?.verificationStatus
    ? governanceLineageVerificationStatusTagPresentation(data.manifest.verificationStatus)
    : null;

  return (
    <div className={OPERATOR_LAYOUT.sectionStack}>
      <OperatorPageHeader
        navHref={GOVERNANCE_APPROVAL_QUEUE_PATH}
        title="Approval lineage"
        subtitle={displayApprovalTitle}
        titleTestId="approval-lineage-page-title"
        breadcrumb={
          <OperatorPageBreadcrumb
            data-testid="approval-lineage-page-breadcrumb"
            items={[
              {
                label: OPERATOR_NAV_GROUP_LABELS.governance,
                href: GOVERNANCE_APPROVAL_QUEUE_PATH,
              },
              {
                label: OPERATOR_NAV_LINK_LABELS.governanceWorkflow,
                href: GOVERNANCE_APPROVAL_QUEUE_PATH,
              },
              {
                label: "Approval lineage",
              },
            ]}
          />
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
            <Button variant="outline" size="sm" asChild>
              <Link href={approvalParentHref}>Back to approval request</Link>
            </Button>
          </div>
        }
      />

      <ApprovalLineageQueueVocabularyRail currentSurfaceId="approval-lineage" />

      <GovernanceApprovalLineageSpine data={data} />

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Approval</CardTitle>
          <CardDescription>Status and reviewer context</CardDescription>
        </CardHeader>
        <CardContent className={cn("grid gap-2", OPERATOR_TYPOGRAPHY.body)}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Status</span>
            <StatusTag kind={approvalStatus.kind} label={approvalStatus.label} />
            {riskPostureStatus ? (
              <>
                <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Risk posture</span>
                <StatusTag kind={riskPostureStatus.kind} label={riskPostureStatus.label} />
              </>
            ) : null}
          </div>
          <div>
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Review</span>{" "}
            <Link className={OPERATOR_LINK.inline} href={reviewHref}>
              Open architecture review
              <span className="sr-only"> ({a.runId})</span>
            </Link>
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
          <CardContent className={cn("grid gap-1", OPERATOR_TYPOGRAPHY.body)}>
            <div>
              <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Status</span>{" "}
              {data.run.status}
            </div>
            <div>
              <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Created</span>{" "}
              {formatInstantForBuyerGovernance(data.run.createdUtc)}
            </div>
            {data.run.completedUtc ? (
              <div>
                <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Completed</span>{" "}
                {formatInstantForBuyerGovernance(data.run.completedUtc)}
              </div>
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
          <CardContent className={cn("grid gap-3", OPERATOR_TYPOGRAPHY.body)}>
            {verificationStatus ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Verification</span>
                <StatusTag kind={verificationStatus.kind} label={verificationStatus.label} />
              </div>
            ) : null}
            {data.manifest.signedBy ? (
              <div className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Signed by {data.manifest.signedBy}
                {data.manifest.signedUtc
                  ? ` · ${formatInstantForBuyerGovernance(data.manifest.signedUtc)}`
                  : null}
              </div>
            ) : null}
            <dl className="m-0 grid gap-2">
              {manifestMetricFields.map((field) => (
                <div key={field.manifestProperty} className="grid gap-0.5">
                  <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{field.label}</dt>
                  <dd className="m-0">
                    <SelfDescribingMetricCount
                      presentation={field.presentation}
                      testId={`approval-lineage-manifest-${field.manifestProperty}`}
                      variant="inline"
                    />
                  </dd>
                </div>
              ))}
            </dl>
            {data.manifest.recordDigest ? (
              <CollapsibleSection
                title="Record digest"
                defaultOpen={false}
                sectionTestId="approval-lineage-record-digest"
              >
                <p className={cn("m-0 font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                  {data.manifest.recordDigest}
                </p>
              </CollapsibleSection>
            ) : null}
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
            <EnterpriseCompactEmptyState {...GOVERNANCE_APPROVAL_LINEAGE_FINDINGS_EMPTY_COMPACT} />
          ) : (
            <ul className={cn("space-y-2", OPERATOR_TYPOGRAPHY.body)}>
              {data.topFindings.map((finding) => (
                <li key={finding.findingId} className="rounded-md border p-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityTag severity={finding.severity} />
                    <Link
                      className={cn("font-medium", OPERATOR_LINK.inline)}
                      href={getFindingDetailHref(a.runId, finding.findingId)}
                      aria-label={`Open finding: ${finding.title}`}
                    >
                      {finding.title}
                    </Link>
                  </div>
                  <div className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                    {finding.engineType} · trace completeness{" "}
                    {formatGovernanceLineageCompletenessPercent(finding.traceCompletenessRatio)}
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
              {data.promotions.map((promotion) => (
                <li key={promotion.promotionRecordId} className="rounded-md border p-2">
                  <div className="font-medium">
                    Promoted {formatInstantForBuyerGovernance(promotion.promotedUtc)} · {promotion.promotedBy}
                  </div>
                  {promotion.notes ? (
                    <div className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>{promotion.notes}</div>
                  ) : null}
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
