"use client";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { SETTINGS_PREFERENCES_PATH } from "@/lib/settings-admin-route-paths";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PreferencesNotificationsVocabularyRail } from "@/components/PreferencesNotificationsVocabularyRail";
import { ShellThemePreferencesAppearanceVocabularyRail } from "@/components/ShellThemePreferencesAppearanceVocabularyRail";
import { ThemePreferenceSelector } from "@/components/ThemePreferenceSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { PREFERENCES_HELP_TOPIC_LABEL } from "@/lib/preferences-settings-evidence-copy";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function PreferencesSettingsPageView() {
  return (
    <OperatorPageContainer variant="settings" className={OPERATOR_LAYOUT.sectionStack} data-testid="preferences-settings-page">
      <OperatorPageHeader
        navHref={SETTINGS_PREFERENCES_PATH}
        title="Preferences"
        subtitle="Personal settings saved to your account."
        titleTestId="preferences-settings-page-title"
        actions={<PageContextualHelpButton triggerText={PREFERENCES_HELP_TOPIC_LABEL} />}
      />
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
    </OperatorPageContainer>
  );
}
