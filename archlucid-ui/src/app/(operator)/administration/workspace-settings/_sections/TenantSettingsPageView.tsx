"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { SETTINGS_WORKSPACE_SETTINGS_PATH } from "@/lib/settings-admin-route-paths";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { WorkspaceScopeTenantSettingsVocabularyRail } from "@/components/WorkspaceScopeTenantSettingsVocabularyRail";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { TenantSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { WORKSPACE_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/tenant-settings-evidence-copy";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  getEffectiveBrowserProxyScopeHeaders,
  readOperatorScopeFromStorage,
} from "@/lib/operator/operator-scope-storage";
import { readActiveTenantContext } from "@/lib/active-tenant-context-display";
import {
  TENANT_SETTINGS_PAGE_SUBTITLE,
  TENANT_SETTINGS_SCOPE_UNRESOLVED_SUMMARY,
  TENANT_SETTINGS_VOCABULARY_CURRENT_LABEL,
  resolveWorkspaceLabelForSummary,
  tenantSettingsCallerAuthorityLine,
  tenantSettingsEffectiveScopeSummary,
} from "@/lib/tenant-settings-page-copy";

import { TenantSettingsBusinessSection } from "./TenantSettingsBusinessSection";
import { TenantSettingsGeneralSection } from "./TenantSettingsGeneralSection";
import type { TenantSettingsPageContentModel } from "./tenant-settings-page-view-model";

type Props = {
  readonly model: TenantSettingsPageContentModel;
};

export function TenantSettingsPageView(props: Props) {
  const m = props.model;
  const scope = getEffectiveBrowserProxyScopeHeaders();
  const [activeScopeSummary, setActiveScopeSummary] = useState<string>(TENANT_SETTINGS_SCOPE_UNRESOLVED_SUMMARY);
  const [callerAuthorityLine, setCallerAuthorityLine] = useState<string | null>(null);
  const [tenantDisplayName, setTenantDisplayName] = useState(() => m.tenantDisplayName);
  const [advancedQualityOpen, setAdvancedQualityOpen] = useState(false);

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
      <OperatorPageHeader
        navHref={SETTINGS_WORKSPACE_SETTINGS_PATH}
        title={OPERATOR_NAV_LINK_LABELS.workspaceSettings}
        subtitle={TENANT_SETTINGS_PAGE_SUBTITLE}
        titleTestId="tenant-settings-page-title"
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
        actions={<PageContextualHelpButton triggerText={WORKSPACE_SETTINGS_HELP_TOPIC_LABEL} />}
      />

      <TenantSettingsEvidenceOrientationStrip />

      <WorkspaceScopeTenantSettingsVocabularyRail
        currentSurfaceId="tenant-settings"
        currentLabel={TENANT_SETTINGS_VOCABULARY_CURRENT_LABEL}
      />

      <TenantSettingsGeneralSection tenantDisplayName={tenantDisplayName} scope={scope} model={m} />

      <TenantSettingsBusinessSection
        canEdit={m.isTenantAdmin}
        advancedQualityOpen={advancedQualityOpen}
        onAdvancedQualityToggle={setAdvancedQualityOpen}
      />
    </OperatorPageContainer>
  );
}
