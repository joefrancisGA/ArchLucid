import { ModelGovernanceAiUsageVocabularyRail } from "@/components/ModelGovernanceAiUsageVocabularyRail";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { ShieldCheck } from "lucide-react";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { ModelGovernanceSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { cn } from "@/lib/utils";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";

import { ModelGovernanceSettingsCard } from "./_sections/ModelGovernanceSettingsCard";
import { ModelGovernanceAzureOpenAiConnectionCard } from "./_sections/ModelGovernanceAzureOpenAiConnectionCard";

/** Admin workspace model governance: default execution profile, alias registry, and profile mappings (TB-871). */
export default function ModelGovernanceSettingsPage() {
  return (
    <OperatorPageContainer variant="settings" className={cn(OPERATOR_LAYOUT.sectionStack, "p-6")} data-testid="model-governance-settings-page">
      <OperatorPageHeader
        navHref="/administration/model-governance"
        icon={ShieldCheck}
        headingLevel="h1"
        title="AI and model governance"
        subtitle="Manage the workspace default execution profile and review governed model aliases used on reviews."
        actions={<PageContextualHelpButton />}
      />
      <ModelGovernanceSettingsEvidenceOrientationStrip />
      <ModelGovernanceAiUsageVocabularyRail currentSurfaceId="model-governance" />
      <ModelGovernanceAzureOpenAiConnectionCard />
      <ModelGovernanceSettingsCard />
    </OperatorPageContainer>
  );
}
