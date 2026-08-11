"use client";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PreferencesNotificationsVocabularyRail } from "@/components/PreferencesNotificationsVocabularyRail";
import { ThemePreferenceSelector } from "@/components/ThemePreferenceSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function PreferencesSettingsPageView() {
  return (
    <div className="w-full max-w-[62rem] space-y-6" data-testid="preferences-settings-page">
      <OperatorPageHeader
        title="Preferences"
        subtitle="Personal settings saved to your account."
        titleTestId="preferences-settings-page-title"
        actions={<PageContextualHelpButton />}
      />
      <PreferencesNotificationsVocabularyRail currentSurfaceId="preferences" />
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
    </div>
  );
}
