"use client";

import Link from "next/link";

import { DeveloperSettingsEvidenceOrientationStrip } from "@/app/(operator)/administration/developer/DeveloperSettingsEvidenceOrientationStrip";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { AuthorityThemeDevSelector } from "@/components/settings/AuthorityThemeDevSelector";
import { TryCliDemoCard } from "@/components/TryCliDemoCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { INTERNAL_DEVELOPER_TOOLS_INTRO } from "./developer-settings-copy";

/** Internal operator developer tools — not linked from customer settings navigation. */
export function DeveloperSettingsPageClient() {
  return (
    <div className="w-full max-w-3xl space-y-6" data-testid="developer-settings-page">
      <Button asChild variant="ghost" size="sm" className="mb-0 h-8 px-0 text-teal-800 dark:text-teal-300">
        <Link href="/administration">← Settings</Link>
      </Button>

      <OperatorPageHeader
        title="Internal developer tools"
        subtitle={INTERNAL_DEVELOPER_TOOLS_INTRO}
        titleTestId="developer-settings-page-title"
        actions={<PageContextualHelpButton />}
      />

      <DeveloperSettingsEvidenceOrientationStrip />

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Branded theme evaluation</CardTitle>
        </CardHeader>
        <CardContent>
          <AuthorityThemeDevSelector />
        </CardContent>
      </Card>

      <TryCliDemoCard />
    </div>
  );
}
