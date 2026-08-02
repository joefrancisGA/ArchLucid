"use client";

import Link from "next/link";

import { ThemePreferenceSelector } from "@/components/ThemePreferenceSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function PreferencesSettingsPageView() {
  return (
    <div className="w-full max-w-3xl space-y-6" data-testid="preferences-settings-page">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 h-8 px-0 text-teal-800 dark:text-teal-300">
          <Link href="/administration/settings">← Settings</Link>
        </Button>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Preferences</h1>
        <p className={cn("mt-1 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Personal settings saved to your account.
        </p>
      </div>

      <Card data-testid="preferences-appearance-card">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Theme</p>
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              Choose how ArchLucid appears. Your preference is saved to your account and applied across supported devices.
            </p>
          </div>
          <ThemePreferenceSelector />
        </CardContent>
      </Card>
    </div>
  );
}
