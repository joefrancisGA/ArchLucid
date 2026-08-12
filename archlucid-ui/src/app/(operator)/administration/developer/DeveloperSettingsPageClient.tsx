"use client";

import { DeveloperApiContractsApiKeysVocabularyRail } from "@/components/DeveloperApiContractsApiKeysVocabularyRail";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { AuthorityThemeDevSelector } from "@/components/settings/AuthorityThemeDevSelector";
import { TryCliDemoCard } from "@/components/TryCliDemoCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PageContextualHelpButton,
  PAGE_HELP_SHORT_TRIGGER_TEXT,
} from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import {
  INTERNAL_DEVELOPER_TOOLS_ACCESS_NOTE,
  INTERNAL_DEVELOPER_TOOLS_INTRO,
} from "./developer-settings-copy";

/** Internal operator developer tools — not linked from customer settings navigation. */
export function DeveloperSettingsPageClient() {
  return (
    <OperatorPageContainer variant="settings" className="space-y-6" data-testid="developer-settings-page">
      <OperatorPageHeader
        title="Internal developer tools"
        subtitle={INTERNAL_DEVELOPER_TOOLS_INTRO}
        titleTestId="developer-settings-page-title"
        actions={<PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />}
      />

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Branded theme evaluation</CardTitle>
        </CardHeader>
        <CardContent>
          <AuthorityThemeDevSelector />
        </CardContent>
      </Card>

      <TryCliDemoCard />

      <details className="rounded-md border border-neutral-200 bg-neutral-50/60 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/30">
        <summary
          className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
        >
          Access and navigation
        </summary>
        <p
          className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="developer-settings-access-note"
        >
          {INTERNAL_DEVELOPER_TOOLS_ACCESS_NOTE}
        </p>
      </details>

      <footer className="space-y-2" aria-label="Related surfaces">
        <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Related surfaces</h3>
        <DeveloperApiContractsApiKeysVocabularyRail currentSurfaceId="developer" />
      </footer>
    </OperatorPageContainer>
  );
}
