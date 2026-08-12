import { ModelGovernanceAiUsageVocabularyRail } from "@/components/ModelGovernanceAiUsageVocabularyRail";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";

import { ModelGovernanceSettingsCard } from "./_sections/ModelGovernanceSettingsCard";

/** Admin workspace model governance: default execution profile, alias registry, and profile mappings (TB-871). */
export default function ModelGovernanceSettingsPage() {
  return (
    <OperatorPageContainer variant="settings" className="space-y-6 p-6" data-testid="model-governance-settings-page">
      <OperatorPageHeader
        headingLevel="h1"
        title="AI and model governance"
        subtitle="Manage the workspace default execution profile and review governed model aliases used on reviews."
        actions={<PageContextualHelpButton />}
      />
      <ModelGovernanceAiUsageVocabularyRail currentSurfaceId="model-governance" />
      <ModelGovernanceSettingsCard />
    </OperatorPageContainer>
  );
}
