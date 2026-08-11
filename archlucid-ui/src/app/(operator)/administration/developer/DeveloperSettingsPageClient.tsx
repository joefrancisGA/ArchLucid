"use client";

import { DeveloperApiContractsApiKeysVocabularyRail } from "@/components/DeveloperApiContractsApiKeysVocabularyRail";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { AuthorityThemeDevSelector } from "@/components/settings/AuthorityThemeDevSelector";
import { TryCliDemoCard } from "@/components/TryCliDemoCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { INTERNAL_DEVELOPER_TOOLS_INTRO } from "./developer-settings-copy";

/** Internal operator developer tools — not linked from customer settings navigation. */
export function DeveloperSettingsPageClient() {
  return (
    <div className="w-full max-w-3xl space-y-6" data-testid="developer-settings-page">
      <OperatorPageHeader
        title="Internal developer tools"
        subtitle={INTERNAL_DEVELOPER_TOOLS_INTRO}
        titleTestId="developer-settings-page-title"
        actions={<PageContextualHelpButton />}
      />
      <DeveloperApiContractsApiKeysVocabularyRail currentSurfaceId="developer" />

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
