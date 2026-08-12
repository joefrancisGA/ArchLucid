"use client";



import { cn } from "@/lib/utils";

import { useCallback, useEffect, useState, type ReactNode } from "react";



import Link from "next/link";



import { CollapsibleSection } from "@/components/CollapsibleSection";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";

import { SupportBundleDownloadButton } from "@/components/SupportBundleDownloadButton";

import { TenantLlmJudgeGuideCard } from "@/components/TenantLlmJudgeGuideCard";

import { WorkspaceScopeTenantSettingsVocabularyRail } from "@/components/WorkspaceScopeTenantSettingsVocabularyRail";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {

  PAGE_HELP_SHORT_TRIGGER_TEXT,

  PageContextualHelpButton,

} from "@/components/usability/PageContextualHelpButton";

import { toDocsBlobUrl } from "@/lib/contextual-help-content";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import {

  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,

  getEffectiveBrowserProxyScopeHeaders,

  readOperatorScopeFromStorage,

} from "@/lib/operator/operator-scope-storage";

import { readActiveTenantContext } from "@/lib/active-tenant-context-display";

import { DIGESTS_SCHEDULE_TAB_PATH } from "@/lib/settings-admin-route-paths";

import {

  TENANT_SETTINGS_ORGANIZATION_IDP_NOTE,

  tenantSettingsActiveScopeSummary,

  tenantSettingsSignedInAsLine,

} from "@/lib/tenant-settings-page-copy";

import { PROJECTS_RECYCLE_BIN_PATH } from "@/lib/vocabulary/projects-recycle-drafts-package-vocabulary";



import { TenantCostSettingsCard } from "./TenantCostSettingsCard";

import { TenantQualityGatesCard } from "./TenantQualityGatesCard";

import { TenantWorkspaceProjectsCard } from "./TenantWorkspaceProjectsCard";

import type { TenantSettingsPageContentModel } from "./tenant-settings-page-view-model";



type SectionHeadingProps = { readonly children: ReactNode };



function SectionHeading({ children }: SectionHeadingProps) {

  return (

    <h2

      className={cn(

        "m-0 border-b border-neutral-200 pb-1 dark:border-neutral-800",

        OPERATOR_TYPOGRAPHY.sectionTitle,

      )}

    >

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

  const signedInAsLine = tenantSettingsSignedInAsLine(m.currentPrincipalName);

  const [activeScopeSummary, setActiveScopeSummary] = useState(() =>

    tenantSettingsActiveScopeSummary(readOperatorScopeFromStorage()),

  );

  const [tenantDisplayName, setTenantDisplayName] = useState(() => m.tenantDisplayName);



  const refreshScopeBoundUi = useCallback(() => {

    setActiveScopeSummary(tenantSettingsActiveScopeSummary(readOperatorScopeFromStorage()));

    setTenantDisplayName(readActiveTenantContext().displayName);

  }, []);



  useEffect(() => {

    setTenantDisplayName(m.tenantDisplayName);

  }, [m.tenantDisplayName]);



  useEffect(() => {

    setActiveScopeSummary(tenantSettingsActiveScopeSummary(readOperatorScopeFromStorage()));



    window.addEventListener("focus", refreshScopeBoundUi);

    window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, refreshScopeBoundUi);



    return () => {

      window.removeEventListener("focus", refreshScopeBoundUi);

      window.removeEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, refreshScopeBoundUi);

    };

  }, [refreshScopeBoundUi]);



  return (

    <OperatorPageContainer variant="settings" className="space-y-6" data-testid="tenant-settings-page">

      <OperatorPageHeader

        title={OPERATOR_NAV_LINK_LABELS.workspaceSettings}

        subtitle="Workspace defaults and tenant-wide configuration."

        titleTestId="tenant-settings-page-title"

        metadata={

          <>

            <span

              className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}

              data-testid="tenant-settings-active-scope-summary"

            >

              {activeScopeSummary}

            </span>

            {signedInAsLine !== null ? (

              <span

                className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}

                data-testid="tenant-settings-signed-in-as"

              >

                {signedInAsLine}

              </span>

            ) : null}

          </>

        }

        actions={<PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />}

      />

      <WorkspaceScopeTenantSettingsVocabularyRail currentSurfaceId="tenant-settings" />

      <SectionHeading>General</SectionHeading>



      <Card data-testid="tenant-settings-organization-card">

        <CardHeader>

          <CardTitle as="h3" className={OPERATOR_TYPOGRAPHY.cardTitle}>

            Organization

          </CardTitle>

        </CardHeader>

        <CardContent className={cn("space-y-1", OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>

          <p

            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}

            data-testid="tenant-settings-tenant-display-name"

          >

            {tenantDisplayName}

          </p>

          <p className="m-0">{TENANT_SETTINGS_ORGANIZATION_IDP_NOTE}</p>

        </CardContent>

      </Card>



      <Card>

        <CardHeader>

          {/* Named apart from the "Workspace scope" vocabulary-rail link (TB-2317) so the page does not repeat one label for two targets. */}

          <CardTitle as="h3" className={OPERATOR_TYPOGRAPHY.cardTitle}>

            Active workspace and projects

          </CardTitle>

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

            <CardTitle as="h3" className={OPERATOR_TYPOGRAPHY.cardTitle}>

              Pilot / trial

            </CardTitle>

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

          <CardTitle as="h3" className={OPERATOR_TYPOGRAPHY.cardTitle}>

            Executive digest (email)

          </CardTitle>

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

          <CardTitle as="h3" className={OPERATOR_TYPOGRAPHY.cardTitle}>

            Support bundle

          </CardTitle>

        </CardHeader>

        <CardContent className={cn("space-y-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>

          <p className="m-0">

            Download a redacted diagnostics bundle to include with a support ticket.

          </p>

          <SupportBundleDownloadButton showDiagnosticsLink />

        </CardContent>

      </Card>



      <SectionHeading>Advanced — AI quality controls</SectionHeading>



      <CollapsibleSection

        title="Quality control settings"

        defaultOpen={false}

        sectionTestId="tenant-advanced-section"

      >

        <p className={cn("mb-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>

          Configure how strictly ArchLucid evaluates generated review output before it is accepted. These settings affect

          AI spend and review pipeline behavior — leave at host defaults unless directed by support.

        </p>

        <div className="space-y-4">

          <TenantLlmJudgeGuideCard />

          <TenantQualityGatesCard />

        </div>

      </CollapsibleSection>

    </OperatorPageContainer>

  );

}


