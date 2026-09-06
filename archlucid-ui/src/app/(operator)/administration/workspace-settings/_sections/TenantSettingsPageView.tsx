"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type SetStateAction } from "react";

import { TenantSettingsSettingsBuyerChrome } from "@/app/(operator)/administration/workspace-settings/_sections/TenantSettingsSettingsBuyerChrome";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { SETTINGS_WORKSPACE_SETTINGS_PATH } from "@/lib/settings-admin-route-paths";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { WorkspaceScopeTenantSettingsVocabularyRail } from "@/components/WorkspaceScopeTenantSettingsVocabularyRail";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { TenantSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { WORKSPACE_SETTINGS_HELP_TOPIC_LABEL, TENANT_SETTINGS_CLAIM_DISCIPLINE } from "@/lib/tenant-settings-evidence-copy";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  getEffectiveBrowserProxyScopeHeaders,
  readOperatorScopeFromStorage,
} from "@/lib/operator/operator-scope-storage";
import { readActiveTenantContext } from "@/lib/active-tenant-context-display";
import {
  parseTenantSettingsQualityAdvancedOpenFromSearch,
  tenantSettingsQualityAdvancedHrefFromSearch,
} from "@/lib/administration/tenant-settings-quality-advanced-url";
import {
  TENANT_SETTINGS_SCOPE_UNRESOLVED_SUMMARY,
  TENANT_SETTINGS_VOCABULARY_CURRENT_LABEL,
  resolveWorkspaceLabelForSummary,
  tenantSettingsCallerAuthorityLine,
  tenantSettingsEffectiveScopeSummary,
} from "@/lib/tenant-settings-page-copy";
import {
  TENANT_SETTINGS_SETTINGS_BUYER_START_HERE_HELPER,
  TENANT_SETTINGS_SETTINGS_FIRST_VIEWPORT_TEST_ID,
  TENANT_SETTINGS_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  TENANT_SETTINGS_SETTINGS_PAGE_LEAD,
  TENANT_SETTINGS_SETTINGS_PRIMARY_CONTENT_ID,
  TENANT_SETTINGS_SETTINGS_SKIP_LINK_LABEL,
  TENANT_SETTINGS_SETTINGS_SKIP_TARGET_ID,
  TENANT_SETTINGS_SETTINGS_START_HERE_CARD_TITLE,
  tenantSettingsPageSubtitle,
} from "@/lib/tenant-settings-settings-page-copy";

import { TenantSettingsBusinessSection } from "./TenantSettingsBusinessSection";
import { TenantSettingsGeneralSection } from "./TenantSettingsGeneralSection";
import type { TenantSettingsPageContentModel } from "./tenant-settings-page-view-model";

type Props = {
  readonly model: TenantSettingsPageContentModel;
};

export function TenantSettingsPageView(props: Props) {
  const m = props.model;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const router = useRouter();
  const pathname = usePathname() ?? SETTINGS_WORKSPACE_SETTINGS_PATH;
  const searchParams = useSearchParams();
  const settingsQualityAdvancedOpenParam = searchParams.get("settingsQualityAdvancedOpen");
  const scope = getEffectiveBrowserProxyScopeHeaders();
  const [activeScopeSummary, setActiveScopeSummary] = useState<string>(TENANT_SETTINGS_SCOPE_UNRESOLVED_SUMMARY);
  const [callerAuthorityLine, setCallerAuthorityLine] = useState<string | null>(null);
  const [tenantDisplayName, setTenantDisplayName] = useState(() => m.tenantDisplayName);
  const [advancedQualityOpen, setAdvancedQualityOpenState] = useState(() =>
    parseTenantSettingsQualityAdvancedOpenFromSearch(settingsQualityAdvancedOpenParam),
  );

  const syncAdvancedQualityOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        tenantSettingsQualityAdvancedHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setAdvancedQualityOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setAdvancedQualityOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncAdvancedQualityOpenToUrl(next);

        return next;
      });
    },
    [syncAdvancedQualityOpenToUrl],
  );

  const refreshScopeBoundUi = useCallback(() => {
    const headers = getEffectiveBrowserProxyScopeHeaders();
    const scopeRecord = readOperatorScopeFromStorage();

    setActiveScopeSummary(tenantSettingsEffectiveScopeSummary(headers, scopeRecord));
    setCallerAuthorityLine(
      tenantSettingsCallerAuthorityLine(
        m.callerAuthorityRank,
        resolveWorkspaceLabelForSummary(headers["x-workspace-id"] ?? "", scopeRecord),
      ),
    );
    setTenantDisplayName(readActiveTenantContext().displayName);
  }, [m.callerAuthorityRank]);

  useEffect(() => {
    setTenantDisplayName(m.tenantDisplayName);
  }, [m.tenantDisplayName]);

  useEffect(() => {
    refreshScopeBoundUi();

    window.addEventListener("focus", refreshScopeBoundUi);
    window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, refreshScopeBoundUi);

    return () => {
      window.removeEventListener("focus", refreshScopeBoundUi);
      window.removeEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, refreshScopeBoundUi);
    };
  }, [refreshScopeBoundUi]);

  return (
    <OperatorPageContainer variant="settings" className={OPERATOR_LAYOUT.sectionStack} data-testid="tenant-settings-page">
      <a
        href={`#${TENANT_SETTINGS_SETTINGS_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {TENANT_SETTINGS_SETTINGS_SKIP_LINK_LABEL}
      </a>

      <div
        id={TENANT_SETTINGS_SETTINGS_PRIMARY_CONTENT_ID}
        data-testid={TENANT_SETTINGS_SETTINGS_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
      >
        <OperatorPageHeader
          navHref={SETTINGS_WORKSPACE_SETTINGS_PATH}
          title={OPERATOR_NAV_LINK_LABELS.workspaceSettings}
          subtitle={tenantSettingsPageSubtitle(buyerPolishedShell)}
          titleTestId="tenant-settings-page-title"
          claimDiscipline={buyerPolishedShell ? TENANT_SETTINGS_CLAIM_DISCIPLINE : undefined}
          claimDisciplineTestId={TENANT_SETTINGS_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          metadata={
            <>
              <span
                className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
                data-testid="tenant-settings-active-scope-summary"
              >
                {activeScopeSummary}
              </span>
              {callerAuthorityLine !== null ? (
                <span
                  className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="tenant-settings-caller-authority"
                >
                  {callerAuthorityLine}
                </span>
              ) : null}
            </>
          }
          actions={
            buyerPolishedShell ? null : (
              <PageContextualHelpButton triggerText={WORKSPACE_SETTINGS_HELP_TOPIC_LABEL} />
            )
          }
        />

        <div
          id={TENANT_SETTINGS_SETTINGS_SKIP_TARGET_ID}
          data-testid={TENANT_SETTINGS_SETTINGS_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          {buyerPolishedShell ? (
            <div className="space-y-4" data-testid="tenant-settings-buyer-first-viewport-intro">
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
                data-testid="tenant-settings-intro"
              >
                {TENANT_SETTINGS_SETTINGS_PAGE_LEAD}
              </p>
              <section
                className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
                data-testid="tenant-settings-start-here-panel"
                aria-labelledby="tenant-settings-start-here-heading"
              >
                <h2
                  id="tenant-settings-start-here-heading"
                  className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
                >
                  {TENANT_SETTINGS_SETTINGS_START_HERE_CARD_TITLE}
                </h2>
                <p
                  className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="tenant-settings-buyer-start-here-helper"
                >
                  {TENANT_SETTINGS_SETTINGS_BUYER_START_HERE_HELPER}
                </p>
              </section>
            </div>
          ) : null}

          {!buyerPolishedShell ? (
            <WorkspaceScopeTenantSettingsVocabularyRail
              currentSurfaceId="tenant-settings"
              currentLabel={TENANT_SETTINGS_VOCABULARY_CURRENT_LABEL}
            />
          ) : null}

          <TenantSettingsGeneralSection
            tenantDisplayName={tenantDisplayName}
            scope={scope}
            model={m}
            buyerPolishedShell={buyerPolishedShell}
          />

          <TenantSettingsBusinessSection
            canEdit={m.isTenantAdmin && !buyerPolishedShell}
            buyerPolishedShell={buyerPolishedShell}
            advancedQualityOpen={advancedQualityOpen}
            onAdvancedQualityToggle={setAdvancedQualityOpen}
          />
        </div>

        {buyerPolishedShell ? (
          <TenantSettingsSettingsBuyerChrome />
        ) : (
          <div data-testid="tenant-settings-orientation-bottom">
            <TenantSettingsEvidenceOrientationStrip />
          </div>
        )}
      </div>
    </OperatorPageContainer>
  );
}
