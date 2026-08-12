"use client";

import { DeveloperApiContractsApiKeysVocabularyRail } from "@/components/DeveloperApiContractsApiKeysVocabularyRail";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { AuthorityThemeDevSelector } from "@/components/settings/AuthorityThemeDevSelector";
import { TryCliDemoCard } from "@/components/TryCliDemoCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import {
  PageContextualHelpButton,
  PAGE_HELP_SHORT_TRIGGER_TEXT,
} from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";
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
  return (
    <OperatorPageContainer variant="settings" className={OPERATOR_LAYOUT.sectionStack} data-testid="developer-settings-page">
      <OperatorPageHeader
        title={INTERNAL_DEVELOPER_TOOLS_PAGE_TITLE}
        subtitle={INTERNAL_DEVELOPER_TOOLS_INTRO}
        titleTestId="developer-settings-page-title"
        breadcrumb={
          <OperatorPageBreadcrumb
            data-testid="developer-settings-page-breadcrumb"
            items={[
              { label: "Administration", href: SETTINGS_ROOT_PATH },
              { label: INTERNAL_DEVELOPER_TOOLS_PAGE_TITLE },
            ]}
          />
        }
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
        actions={<PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />}
      />

      <DeveloperApiContractsApiKeysVocabularyRail currentSurfaceId="developer" />

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
    </OperatorPageContainer>
  );
}
