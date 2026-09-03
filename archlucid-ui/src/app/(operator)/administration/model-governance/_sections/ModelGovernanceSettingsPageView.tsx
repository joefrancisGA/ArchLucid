"use client";

import { ShieldCheck } from "lucide-react";

import { ModelGovernanceAiUsageVocabularyRail } from "@/components/ModelGovernanceAiUsageVocabularyRail";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { ModelGovernanceSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { cn } from "@/lib/utils";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  AI_MODELS_SETTINGS_PAGE_TITLE,
  MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH,
  MODEL_GOVERNANCE_SETTINGS_CLAIM_DISCIPLINE,
} from "@/lib/model-governance-settings-evidence-copy";

import { ModelGovernanceSettingsCard } from "./ModelGovernanceSettingsCard";
import { ModelGovernanceSettingsHeaderActions } from "./ModelGovernanceSettingsHeaderActions";
import {
  MODEL_GOVERNANCE_SETTINGS_FIRST_VIEWPORT_ID,
  MODEL_GOVERNANCE_SETTINGS_PRIMARY_CONTENT_ID,
  MODEL_GOVERNANCE_SETTINGS_SKIP_LINK_LABEL,
  MODEL_GOVERNANCE_SETTINGS_SKIP_TARGET_ID,
  modelGovernanceSettingsPageSubtitle,
} from "./model-governance-settings-page-copy";

/** Admin workspace model policy: execution profile, allowed models, and task-to-alias mappings (TB-871). */
export function ModelGovernanceSettingsPageView(): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <OperatorPageContainer
      variant="settings"
      className={cn(OPERATOR_LAYOUT.sectionStack, "p-6")}
      data-testid="model-governance-settings-page"
    >
      <a
        href={`#${MODEL_GOVERNANCE_SETTINGS_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {MODEL_GOVERNANCE_SETTINGS_SKIP_LINK_LABEL}
      </a>

      <div
        id={MODEL_GOVERNANCE_SETTINGS_PRIMARY_CONTENT_ID}
        data-testid="model-governance-settings-primary-content"
        className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
      >
        <OperatorPageHeader
          navHref={MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH}
          icon={ShieldCheck}
          headingLevel="h1"
          title={AI_MODELS_SETTINGS_PAGE_TITLE}
          subtitle={modelGovernanceSettingsPageSubtitle(buyerPolishedShell)}
          claimDiscipline={MODEL_GOVERNANCE_SETTINGS_CLAIM_DISCIPLINE}
          claimDisciplineTestId="model-governance-settings-claim-discipline"
          actions={<ModelGovernanceSettingsHeaderActions />}
        />

        <div
          id={MODEL_GOVERNANCE_SETTINGS_FIRST_VIEWPORT_ID}
          data-testid={MODEL_GOVERNANCE_SETTINGS_FIRST_VIEWPORT_ID}
          className={cn(
            "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <ModelGovernanceSettingsCard />
        </div>

        {buyerPolishedShell ? null : (
          <ModelGovernanceAiUsageVocabularyRail currentSurfaceId="model-governance" />
        )}

        <div data-testid="model-governance-settings-orientation-bottom">
          <ModelGovernanceSettingsEvidenceOrientationStrip />
        </div>
      </div>
    </OperatorPageContainer>
  );
}
