"use client";

import Link from "next/link";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { DeploymentStatusSystemHealthVocabularyRail } from "@/components/DeploymentStatusSystemHealthVocabularyRail";
import { DeploymentStatusEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { PageHeading } from "@/components/PageHeading";
import { ExternalLink } from "@/components/ui/external-link";
import { StatusTag } from "@/components/ui/status-tag";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { cn } from "@/lib/utils";
import { displayDeploymentField, deploymentOverallStatusShortLabel, deploymentOverallStatusTagKind, resolveOverallTone } from "@/lib/admin-deployment-status";
import { INTERNAL_OPERATIONS_NAV_EYEBROW } from "@/lib/demo-readiness-evidence-copy";
import {
  ADMIN_DEPLOYMENT_STATUS_DIAGNOSTICS_LINK,
  ADMIN_DEPLOYMENT_STATUS_DEMO_UNAVAILABLE_DESCRIPTION,
  ADMIN_DEPLOYMENT_STATUS_EMPTY_BODY,
  ADMIN_DEPLOYMENT_STATUS_EMPTY_TITLE,
  ADMIN_DEPLOYMENT_STATUS_EXTERNAL_LINK_NEW_TAB_SUFFIX,
  ADMIN_DEPLOYMENT_STATUS_PAGE_LEAD,
  ADMIN_DEPLOYMENT_STATUS_PAGE_TITLE,
} from "@/lib/deployment-status-evidence-copy";
import { OPERATOR_LAYOUT, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { INTERNAL_DEPLOYMENT_STATUS_PATH, INTERNAL_HEALTH_PATH } from "@/lib/internal-ops-route-paths";

import { AdminDeploymentStatusPageLoadingSkeleton } from "./AdminDeploymentStatusPageLoadingSkeleton";
import type { AdminDeploymentStatusPageViewModel } from "./admin-deployment-status-view-model";

type Props = {
  readonly model: AdminDeploymentStatusPageViewModel;
};

function FieldRow(props: { readonly label: string; readonly value: string; readonly testId: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-al-border/60 py-3 sm:grid-cols-[14rem_1fr] sm:gap-4">
      <dt className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{props.label}</dt>
      <dd
        className={cn("m-0 break-all font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
        data-testid={props.testId}
      >
        {displayDeploymentField(props.value)}
      </dd>
    </div>
  );
}

/**
 * Internal-only deployment identity and component agreement view.
 */
export function AdminDeploymentStatusPageView(props: Props) {
  const m = props.model;

  if (m.isDemo) {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability="Deployment status"
        description={ADMIN_DEPLOYMENT_STATUS_DEMO_UNAVAILABLE_DESCRIPTION}
      />
    );
  }

  const status = m.status;
  const overall = displayDeploymentField(status?.overallStatus);
  const overallTone = resolveOverallTone(overall);
  const overallLabel = status?.overallStatusLabel ?? "Unknown — waiting for data.";
  const showInitialLoading = m.loading && status === null && m.error === null;
  const showEmptyState = status === null && !m.loading && m.error === null;

  return (
    <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack} data-testid="admin-deployment-status-page">
      <PageHeading
        navHref={INTERNAL_DEPLOYMENT_STATUS_PATH}
        title={ADMIN_DEPLOYMENT_STATUS_PAGE_TITLE}
        titleTestId="admin-deployment-status-page-title"
        metadata={
          <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)} data-testid="admin-deployment-status-ops-eyebrow">
            {INTERNAL_OPERATIONS_NAV_EYEBROW}
          </p>
        }
        description={
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="admin-deployment-status-page-lead"
          >
            {ADMIN_DEPLOYMENT_STATUS_PAGE_LEAD}
          </p>
        }
        actions={
          <>
            <RefreshButton
              busy={m.loading}
              className="h-8"
              onClick={() => void m.refresh()}
              data-testid="admin-deployment-status-refresh"
            />
            <PageContextualHelpButton />
          </>
        }
        data-testid="admin-deployment-status-page-heading"
      >
        <div className="flex flex-wrap items-center gap-3">
          {m.lastRefreshedAt !== null ? (
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Last refreshed {m.lastRefreshedAt.toLocaleString()}
            </span>
          ) : null}
          <Link
            href={INTERNAL_HEALTH_PATH}
            className={cn("text-al-accent underline-offset-2 hover:underline", OPERATOR_TYPOGRAPHY.body)}
            data-testid="admin-deployment-status-diagnostics-link"
          >
            {ADMIN_DEPLOYMENT_STATUS_DIAGNOSTICS_LINK}
          </Link>
        </div>
      </PageHeading>

      <DeploymentStatusEvidenceOrientationStrip />

      <DeploymentStatusSystemHealthVocabularyRail currentSurfaceId="deployment-status" />

      {!showInitialLoading ? (
        <div className="flex flex-wrap items-center gap-3" data-testid="admin-deployment-status-overall">
          <StatusTag
            kind={deploymentOverallStatusTagKind(overallTone)}
            label={deploymentOverallStatusShortLabel(overallTone)}
            aria-label={`Overall status: ${overallLabel}`}
            data-testid="admin-deployment-status-overall-tag"
          />
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{overallLabel}</p>
        </div>
      ) : null}

      {m.error !== null ? (
        <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {m.error}
        </p>
      ) : null}

      {showInitialLoading ? <AdminDeploymentStatusPageLoadingSkeleton /> : null}

      {showEmptyState ? (
        <EnterpriseCompactEmptyState
          title={ADMIN_DEPLOYMENT_STATUS_EMPTY_TITLE}
          description={ADMIN_DEPLOYMENT_STATUS_EMPTY_BODY}
          footer={
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => void m.refresh()}
              data-testid="admin-deployment-status-empty-refresh"
            >
              Refresh
            </Button>
          }
          testId="admin-deployment-status-empty"
        />
      ) : null}

      {status !== null ? (
        <>
          {m.loading ? <AdminDeploymentStatusPageLoadingSkeleton /> : null}

          {!m.loading ? (
            <>
              <section aria-labelledby="deployment-identity-heading" className="space-y-1">
                <h2 id="deployment-identity-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                  Release identity
                </h2>
                <dl className="m-0">
                  <FieldRow label="Environment" value={status.environment} testId="ds-environment" />
                  <FieldRow label="Release build ID" value={status.releaseBuildId} testId="ds-release-build-id" />
                  <FieldRow label="Source commit" value={status.sourceCommit} testId="ds-source-commit" />
                  <FieldRow label="Frontend build ID" value={status.frontendBuildId} testId="ds-frontend-build-id" />
                  <FieldRow label="API build ID" value={status.apiBuildId} testId="ds-api-build-id" />
                  <FieldRow label="Worker build ID" value={status.workerBuildId} testId="ds-worker-build-id" />
                  <FieldRow label="Deployment time (UTC)" value={status.deploymentTimeUtc} testId="ds-deployment-time" />
                  <FieldRow
                    label="Active platform revision"
                    value={status.activePlatformRevision}
                    testId="ds-active-revision"
                  />
                </dl>
              </section>

              <section aria-labelledby="deployment-health-heading" className="space-y-1">
                <h2 id="deployment-health-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                  Health and schema
                </h2>
                <dl className="m-0">
                  <FieldRow label="Health status" value={status.healthStatus} testId="ds-health-status" />
                  <FieldRow label="Readiness status" value={status.readinessStatus} testId="ds-readiness-status" />
                  <FieldRow
                    label="Database migration version"
                    value={status.databaseMigrationVersion}
                    testId="ds-migration-version"
                  />
                  <FieldRow
                    label="Latest smoke-test result"
                    value={status.latestSmokeTestResult}
                    testId="ds-smoke-result"
                  />
                  <FieldRow
                    label="Last known-good build"
                    value={status.lastKnownGoodBuildId}
                    testId="ds-last-known-good"
                  />
                </dl>
              </section>

              <section aria-labelledby="deployment-agreement-heading" className="space-y-2">
                <h2 id="deployment-agreement-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                  Component agreement
                </h2>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="ds-component-agreement">
                  <span className="font-medium">{displayDeploymentField(status.componentAgreement)}</span>
                  {" — "}
                  {displayDeploymentField(status.componentAgreementDetail)}
                </p>
              </section>

              {status.links.length > 0 ? (
                <section aria-labelledby="deployment-links-heading" className="space-y-2">
                  <h2 id="deployment-links-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                    Related links
                  </h2>
                  <ul className="m-0 list-disc space-y-1 pl-5" data-testid="ds-links">
                    {status.links.map((link) => (
                      <li key={`${link.kind}-${link.url}`}>
                        <ExternalLink
                          href={link.url}
                          className="text-al-accent underline-offset-2 hover:underline"
                          data-testid={`ds-external-link-${link.kind}`}
                        >
                          {link.label}
                          <span className="sr-only"> {ADMIN_DEPLOYMENT_STATUS_EXTERNAL_LINK_NEW_TAB_SUFFIX}</span>
                        </ExternalLink>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </OperatorPageContainer>
  );
}
