"use client";

import { BrandingSettingsFormFields } from "@/app/(operator)/administration/branding/BrandingSettingsFormFields";
import { useTenantBrandingAdminSettings } from "@/app/(operator)/administration/branding/use-tenant-branding-admin-settings";
import { DemoUnavailableNotice } from "@/components/DemoUnavailableNotice";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  TENANT_BRANDING_SETTINGS_PAGE_SUBTITLE,
  TENANT_BRANDING_SETTINGS_PAGE_TITLE,
} from "@/lib/tenant-branding-settings-page-copy";
import { cn } from "@/lib/utils";

export function BrandingSettingsPageClient() {
  const canEdit = useNavCallerAuthorityRank() >= AUTHORITY_RANK.AdminAuthority;
  const settings = useTenantBrandingAdminSettings({ canEdit });

  return (
    <OperatorPageContainer variant="settings" className={OPERATOR_LAYOUT.sectionStack}>
      <OperatorPageHeader
        title={TENANT_BRANDING_SETTINGS_PAGE_TITLE}
        subtitle={TENANT_BRANDING_SETTINGS_PAGE_SUBTITLE}
        titleTestId="branding-settings-page-title"
      />

      {settings.demoMode ? (
        <DemoUnavailableNotice
          title="Branding settings"
          description="Tenant branding requires a connected deployment and admin API access."
        />
      ) : null}

      {!settings.demoMode && settings.loadFailure !== null ? (
        <OperatorApiProblem
          problem={settings.loadFailure.problem}
          fallbackMessage={settings.loadFailure.message}
          correlationId={settings.loadFailure.correlationId}
        />
      ) : null}

      {!settings.demoMode && settings.loading ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p>
      ) : null}

      {!settings.demoMode && !settings.loading && settings.loadFailure === null ? (
        <BrandingSettingsFormFields {...settings} canEdit={canEdit} />
      ) : null}
    </OperatorPageContainer>
  );
}
