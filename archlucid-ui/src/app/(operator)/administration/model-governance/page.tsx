import { ModelGovernanceAiUsageVocabularyRail } from "@/components/ModelGovernanceAiUsageVocabularyRail";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { ShieldCheck } from "lucide-react";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { ModelGovernanceSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { cn } from "@/lib/utils";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import {
  AI_MODELS_SETTINGS_PAGE_SUBTITLE,
  AI_MODELS_SETTINGS_PAGE_TITLE,
} from "@/lib/model-governance-settings-evidence-copy";

import { ModelGovernanceSettingsCard } from "./_sections/ModelGovernanceSettingsCard";

/** Admin workspace model policy: execution profile, allowed models, and task-to-alias mappings (TB-871). */
export default function ModelGovernanceSettingsPage() {
  return (
    <OperatorPageContainer variant="settings" className={cn(OPERATOR_LAYOUT.sectionStack, "p-6")} data-testid="model-governance-settings-page">
      <OperatorPageHeader
        navHref="/administration/model-governance"
        icon={ShieldCheck}
        headingLevel="h1"
        title={AI_MODELS_SETTINGS_PAGE_TITLE}
        subtitle={AI_MODELS_SETTINGS_PAGE_SUBTITLE}
        actions={<PageContextualHelpButton />}
      />
      <ModelGovernanceSettingsEvidenceOrientationStrip />
      <ModelGovernanceAiUsageVocabularyRail currentSurfaceId="model-governance" />
      <ModelGovernanceSettingsCard />
    </OperatorPageContainer>
  );
}
