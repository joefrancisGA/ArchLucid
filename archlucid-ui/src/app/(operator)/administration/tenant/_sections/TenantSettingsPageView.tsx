"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

import Link from "next/link";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { SupportBundleDownloadButton } from "@/components/SupportBundleDownloadButton";
import { TenantLlmJudgeGuideCard } from "@/components/TenantLlmJudgeGuideCard";
import { WorkspaceScopeTenantSettingsVocabularyRail } from "@/components/WorkspaceScopeTenantSettingsVocabularyRail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { toDocsBlobUrl } from "@/lib/contextual-help-content";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";
import { DIGESTS_SCHEDULE_TAB_PATH } from "@/lib/settings-admin-route-paths";
import { PROJECTS_RECYCLE_BIN_PATH } from "@/lib/vocabulary/projects-recycle-drafts-package-vocabulary";

import { TenantCostSettingsCard } from "./TenantCostSettingsCard";
import { TenantQualityGatesCard } from "./TenantQualityGatesCard";
import { TenantWorkspaceProjectsCard } from "./TenantWorkspaceProjectsCard";
import type { TenantSettingsPageContentModel } from "./tenant-settings-page-view-model";

type SectionHeadingProps = { readonly children: ReactNode };

function SectionHeading({ children }: SectionHeadingProps) {
  return (
    <h2 className={cn("border-b border-neutral-200 pb-1 dark:border-neutral-800", OPERATOR_NAV_GROUP_LABEL)}>
      {children}
    </h2>
  );
}

type Props = {
  readonly model: TenantSettingsPageContentModel;
};

export function TenantSettingsPageView(props: Props) {
  const m = props.model;
  const scope = getEffectiveBrowserProxyScopeHeaders();

  return (
    <div className="w-full max-w-3xl space-y-6" data-testid="tenant-settings-page">
      <OperatorPageHeader
        title={OPERATOR_NAV_LINK_LABELS.workspaceSettings}
        subtitle="Workspace defaults and tenant-wide configuration."
        titleTestId="tenant-settings-page-title"
        actions={<PageContextualHelpButton />}
      />
      <WorkspaceScopeTenantSettingsVocabularyRail currentSurfaceId="tenant-settings" />
<SectionHeading>General</SectionHeading>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Tenant name</CardTitle>
        </CardHeader>
        <CardContent className={cn("space-y-1", OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
          <p className="m-0">Organization name is managed by your identity provider.</p>
          {m.currentPrincipalName != null ? (
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              Signed in as:{" "}
              <span className={cn(OPERATOR_TYPOGRAPHY.body, "font-medium text-al-text-primary")}>{m.currentPrincipalName}</span>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          {/* Named apart from the "Workspace scope" vocabulary-rail link (TB-2317) so the page does not repeat one label for two targets. */}
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Active workspace and projects</CardTitle>
        </CardHeader>
        <CardContent className={cn("space-y-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <p className="m-0">
            Your active workspace and project are selected from the workspace switcher.
          </p>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            Soft-deleted architecture projects move to the projects recycle bin, where you can review or restore them
            before permanent removal.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href={PROJECTS_RECYCLE_BIN_PATH} data-testid="tenant-settings-recycle-bin-link">
              Open projects recycle bin
            </Link>
          </Button>

          <CollapsibleSection title="Technical details — routing scope" defaultOpen={false}>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              Internal browser-to-API routing carries scope identifiers on proxied requests. Values below reflect your
              current selection.
            </p>
            <ul className={cn("m-0 mt-2 list-inside list-disc", OPERATOR_TYPOGRAPHY.body)}>
              <li>
                Tenant: <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{scope["x-tenant-id"]}</span>
              </li>
              <li>
                Workspace: <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{scope["x-workspace-id"]}</span>
              </li>
              <li>
                Project: <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{scope["x-project-id"]}</span>
              </li>
            </ul>
            <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              Hosted deployments with more than one API instance should use a shared projection cache —{" "}
              <a
                className={OPERATOR_LINK.inline}
                href={toDocsBlobUrl("/docs/operations/PROJECTION_CACHE_AND_REPLICAS.md")}
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more about projection cache and replicas
              </a>
              .
            </p>
          </CollapsibleSection>
        </CardContent>
      </Card>

      <TenantWorkspaceProjectsCard />

      {/* Only render when an active pilot/trial exists; hide the "None" / null state to reduce noise */}
      {m.trial != null && m.trial.status != null && m.trial.status !== "None" ? (
        <Card>
          <CardHeader>
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Pilot / trial</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              <span className="font-medium">Status:</span> {m.trial.status}
              {typeof m.trial.daysRemaining === "number" ? (
                <span>
                  {" "}
                  — <span className="font-medium">Days remaining:</span> {m.trial.daysRemaining}
                </span>
              ) : null}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <SectionHeading>Business settings</SectionHeading>

      <TenantCostSettingsCard canEdit={m.isTenantAdmin} />

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Executive digest (email)</CardTitle>
        </CardHeader>
        <CardContent className={cn("space-y-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <p className="m-0">
            Recipients, time zone, and send schedule are managed on the Digests hub, alongside delivery readiness and
            subscription health.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href={DIGESTS_SCHEDULE_TAB_PATH}>Open digest schedule</Link>
          </Button>
        </CardContent>
      </Card>

      <SectionHeading>Support &amp; diagnostics</SectionHeading>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Support bundle</CardTitle>
        </CardHeader>
        <CardContent className={cn("space-y-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <p className="m-0">
            Download a redacted diagnostics bundle to include with a support ticket.
          </p>
          <SupportBundleDownloadButton showDiagnosticsLink />
        </CardContent>
      </Card>

      <CollapsibleSection
        title="Advanced — AI quality controls"
        defaultOpen={false}
        sectionTestId="tenant-advanced-section"
      >
        <p className={cn("mb-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Configure how strictly ArchLucid evaluates generated review output before it is accepted. These settings affect
          AI spend and review pipeline behaviour — leave at host defaults unless directed by support.
        </p>
        <div className="space-y-4">
          <TenantLlmJudgeGuideCard />
          <TenantQualityGatesCard />
        </div>
      </CollapsibleSection>
    </div>
  );
}
