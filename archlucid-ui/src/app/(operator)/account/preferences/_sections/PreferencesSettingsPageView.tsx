"use client";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { CloudPlatformScopePanel } from "@/components/preferences/CloudPlatformScopePanel";
import { WhereToGoNextPreferencePanel } from "@/components/preferences/WhereToGoNextPreferencePanel";
import { PreferencesNotificationsVocabularyRail } from "@/components/PreferencesNotificationsVocabularyRail";
import { ShellThemePreferencesAppearanceVocabularyRail } from "@/components/ShellThemePreferencesAppearanceVocabularyRail";
import { ThemePreferenceSelector } from "@/components/ThemePreferenceSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { PreferencesSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { ACCOUNT_PREFERENCES_PATH } from "@/lib/account-route-paths";
import { PREFERENCES_CLOUD_PLATFORMS_HEADING } from "@/lib/cloud-platform-scope-copy";
import { PREFERENCES_WHERE_TO_GO_NEXT_HEADING } from "@/lib/where-to-go-next-preference-copy";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { PREFERENCES_HELP_TOPIC_LABEL } from "@/lib/preferences-settings-evidence-copy";
import { useCloudPlatformScope } from "@/lib/use-cloud-platform-scope";
import { useWhereToGoNextPreference } from "@/components/WhereToGoNextPreferenceProvider";
import { cn } from "@/lib/utils";

export function PreferencesSettingsPageView() {
  const { scope, mounted, accountSyncState, setAndPersist } = useCloudPlatformScope();
  const {
    enabled: whereToGoNextEnabled,
    mounted: whereToGoNextMounted,
    accountSyncState: whereToGoNextAccountSyncState,
    setAndPersist: setWhereToGoNextAndPersist,
  } = useWhereToGoNextPreference();

  return (
    <OperatorPageContainer variant="settings" className={OPERATOR_LAYOUT.sectionStack} data-testid="preferences-settings-page">
      <OperatorPageHeader
        navHref={ACCOUNT_PREFERENCES_PATH}
        title="Preferences"
        subtitle="Personal settings saved to your account."
        titleTestId="preferences-settings-page-title"
        actions={<PageContextualHelpButton triggerText={PREFERENCES_HELP_TOPIC_LABEL} />}
      />
      <PreferencesSettingsEvidenceOrientationStrip />
      <PreferencesNotificationsVocabularyRail currentSurfaceId="preferences" />
      <ShellThemePreferencesAppearanceVocabularyRail currentSurfaceId="preferences-appearance" />
      <Card data-testid="preferences-appearance-card">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Theme</p>
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              Choose how ArchLucid appears. Your preference is saved to your account and applied across supported
              devices.
            </p>
          </div>
          <ThemePreferenceSelector />
        </CardContent>
      </Card>
      <Card id="cloud-platforms-shown" data-testid="preferences-cloud-platforms-card">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{PREFERENCES_CLOUD_PLATFORMS_HEADING}</CardTitle>
        </CardHeader>
        <CardContent>
          {mounted ? (
            <CloudPlatformScopePanel
              scope={scope}
              onScopeChange={setAndPersist}
              accountSyncState={accountSyncState}
            />
          ) : (
            <div aria-hidden="true" className="h-24 w-full" data-testid="cloud-platform-scope-loading" />
          )}
        </CardContent>
      </Card>
      <Card id="where-to-go-next" data-testid="preferences-where-to-go-next-card">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{PREFERENCES_WHERE_TO_GO_NEXT_HEADING}</CardTitle>
        </CardHeader>
        <CardContent>
          {whereToGoNextMounted ? (
            <WhereToGoNextPreferencePanel
              enabled={whereToGoNextEnabled}
              onEnabledChange={setWhereToGoNextAndPersist}
              accountSyncState={whereToGoNextAccountSyncState}
            />
          ) : (
            <div aria-hidden="true" className="h-16 w-full" data-testid="where-to-go-next-preference-loading" />
          )}
        </CardContent>
      </Card>
    </OperatorPageContainer>
  );
}
