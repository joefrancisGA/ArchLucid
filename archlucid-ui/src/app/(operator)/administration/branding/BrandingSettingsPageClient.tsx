"use client";

import { BrandingSettingsBreadcrumb } from "@/app/(operator)/administration/branding/BrandingSettingsBreadcrumb";
import { BrandingSettingsFormFields } from "@/app/(operator)/administration/branding/BrandingSettingsFormFields";
import { useTenantBrandingAdminSettings } from "@/app/(operator)/administration/branding/use-tenant-branding-admin-settings";
import { DemoUnavailableNotice } from "@/components/DemoUnavailableNotice";
import { BrandingSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";
import { TENANT_BRANDING_SETTINGS_CLAIM_DISCIPLINE } from "@/lib/tenant-branding-settings-evidence-copy";
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
      <a href="#branding-settings-first-viewport" className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        Skip to branding settings
      </a>

      <BrandingSettingsBreadcrumb />

      <OperatorPageHeader
        navHref={SETTINGS_ROOT_PATH}
        title={TENANT_BRANDING_SETTINGS_PAGE_TITLE}
        subtitle={TENANT_BRANDING_SETTINGS_PAGE_SUBTITLE}
        titleTestId="branding-settings-page-title"
        claimDiscipline={TENANT_BRANDING_SETTINGS_CLAIM_DISCIPLINE}
        claimDisciplineTestId="branding-settings-header-claim-discipline"
        actions={<PageContextualHelpButton />}
      />

      <div
        id="branding-settings-first-viewport"
        data-testid="branding-settings-first-viewport"
        className={cn("scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800", OPERATOR_LAYOUT.sectionStack)}
      >

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

        <BrandingSettingsEvidenceOrientationStrip />
      </div>
    </OperatorPageContainer>
  );
}
