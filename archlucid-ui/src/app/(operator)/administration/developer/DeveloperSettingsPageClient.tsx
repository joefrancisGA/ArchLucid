"use client";

import { DeveloperApiContractsApiKeysVocabularyRail } from "@/components/DeveloperApiContractsApiKeysVocabularyRail";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { AuthorityThemeDevSelector } from "@/components/settings/AuthorityThemeDevSelector";
import { TryCliDemoCard } from "@/components/TryCliDemoCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import {
  PageContextualHelpButton,
  PAGE_HELP_SHORT_TRIGGER_TEXT,
} from "@/components/usability/PageContextualHelpButton";
import { DeveloperSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-settings-strips";
import { DEVELOPER_SETTINGS_CLAIM_DISCIPLINE } from "@/lib/developer-settings-evidence-copy";
import {
  DEVELOPER_SETTINGS_FIRST_VIEWPORT_TEST_ID,
  DEVELOPER_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  DEVELOPER_SETTINGS_PRIMARY_CONTENT_ID,
  DEVELOPER_SETTINGS_SKIP_LINK_LABEL,
  DEVELOPER_SETTINGS_SKIP_TARGET_ID,
  developerSettingsPageSubtitle,
} from "@/lib/developer-settings-page-copy";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { cn } from "@/lib/utils";

import { DeveloperSettingsBuildIdentityCard } from "./DeveloperSettingsBuildIdentityCard";
import {
  INTERNAL_DEVELOPER_TOOLS_ACCESS_NOTE,
  INTERNAL_DEVELOPER_TOOLS_CATALOG_GATE_NOTE,
  INTERNAL_DEVELOPER_TOOLS_INTRO,
  INTERNAL_DEVELOPER_TOOLS_INTERNAL_ONLY_TAG,
  INTERNAL_DEVELOPER_TOOLS_PAGE_TITLE,
} from "./developer-settings-copy";

/** Internal operator developer tools — not linked from customer settings navigation. */
export function DeveloperSettingsPageClient() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <OperatorPageContainer variant="settings" className={OPERATOR_LAYOUT.sectionStack} data-testid="developer-settings-page">
      <a
        href={`#${DEVELOPER_SETTINGS_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {DEVELOPER_SETTINGS_SKIP_LINK_LABEL}
      </a>

      <div
        id={DEVELOPER_SETTINGS_PRIMARY_CONTENT_ID}
        data-testid={DEVELOPER_SETTINGS_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
      >
        <OperatorPageHeader
          title={INTERNAL_DEVELOPER_TOOLS_PAGE_TITLE}
          subtitle={developerSettingsPageSubtitle(buyerPolishedShell, INTERNAL_DEVELOPER_TOOLS_INTRO)}
          titleTestId="developer-settings-page-title"
          claimDiscipline={DEVELOPER_SETTINGS_CLAIM_DISCIPLINE}
          claimDisciplineTestId={DEVELOPER_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          statusBadge={
            <StatusTag
              kind="neutral"
              label={INTERNAL_DEVELOPER_TOOLS_INTERNAL_ONLY_TAG}
              data-testid="developer-settings-internal-only-tag"
            />
          }
          metadata={
            <span
              className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="developer-settings-gate-note"
            >
              {INTERNAL_DEVELOPER_TOOLS_CATALOG_GATE_NOTE}
            </span>
          }
          actions={
            buyerPolishedShell ? null : (
              <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
            )
          }
        />

        <div
          id={DEVELOPER_SETTINGS_SKIP_TARGET_ID}
          data-testid={DEVELOPER_SETTINGS_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          {!buyerPolishedShell ? (
            <DeveloperApiContractsApiKeysVocabularyRail currentSurfaceId="developer" />
          ) : null}

          <DeveloperSettingsBuildIdentityCard />

          <Card>
            <CardHeader>
              <CardTitle as="h3" className={OPERATOR_TYPOGRAPHY.cardTitle}>
                Branded theme evaluation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AuthorityThemeDevSelector />
            </CardContent>
          </Card>

          <TryCliDemoCard hideCliHelpLink={buyerPolishedShell} />

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
        </div>

        <div data-testid="developer-settings-orientation-bottom">
          <DeveloperSettingsEvidenceOrientationStrip />
        </div>
      </div>
    </OperatorPageContainer>
  );
}
