"use client";

import Link from "next/link";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { DeploymentStatusSystemHealthVocabularyRail } from "@/components/DeploymentStatusSystemHealthVocabularyRail";
import { ExternalLink } from "@/components/ui/external-link";
import { StatusTag } from "@/components/ui/status-tag";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { cn } from "@/lib/utils";
import { displayDeploymentField, deploymentOverallStatusShortLabel, deploymentOverallStatusTagKind, resolveOverallTone } from "@/lib/admin-deployment-status";
import {
  ADMIN_DEPLOYMENT_STATUS_DEMO_UNAVAILABLE_DESCRIPTION,
  ADMIN_DEPLOYMENT_STATUS_EXTERNAL_LINK_NEW_TAB_SUFFIX,
  ADMIN_DEPLOYMENT_STATUS_PAGE_LEAD,
} from "@/lib/deployment-status-evidence-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6" data-testid="admin-deployment-status-page">
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Deployment status</h1>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="admin-deployment-status-page-lead"
            >
              {ADMIN_DEPLOYMENT_STATUS_PAGE_LEAD}
            </p>
          </div>
          <PageContextualHelpButton />
        </div>
        <DeploymentStatusSystemHealthVocabularyRail currentSurfaceId="deployment-status" />
        <div className="flex flex-wrap items-center gap-3" data-testid="admin-deployment-status-overall">
          <StatusTag
            kind={deploymentOverallStatusTagKind(overallTone)}
            label={deploymentOverallStatusShortLabel(overallTone)}
            aria-label={`Overall status: ${overallLabel}`}
            data-testid="admin-deployment-status-overall-tag"
          />
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{overallLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={m.loading}
            onClick={() => void m.refresh()}
            data-testid="admin-deployment-status-refresh"
          >
            {m.loading ? "Refreshing…" : "Refresh"}
          </Button>
          {m.lastRefreshedAt !== null ? (
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Last refreshed {m.lastRefreshedAt.toLocaleString()}
            </span>
          ) : null}
          <Link
            href="/internal/health"
            className={cn("text-al-accent underline-offset-2 hover:underline", OPERATOR_TYPOGRAPHY.body)}
          >
            Open diagnostics dashboard
          </Link>
        </div>
      </header>
{m.error !== null ? (
        <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {m.error}
        </p>
      ) : null}

      {status === null && !m.loading && m.error === null ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          No deployment status data yet. Use Refresh.
        </p>
      ) : null}

      {status !== null ? (
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
    </div>
  );
}
