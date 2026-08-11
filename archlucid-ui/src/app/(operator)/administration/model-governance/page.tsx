import { ModelGovernanceAiUsageVocabularyRail } from "@/components/ModelGovernanceAiUsageVocabularyRail";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { ModelGovernanceSettingsCard } from "./_sections/ModelGovernanceSettingsCard";

/** Admin workspace model governance: default execution profile, alias registry, and profile mappings (TB-871). */
export default function ModelGovernanceSettingsPage() {
  return (
    <div className="w-full max-w-4xl space-y-6 p-6" data-testid="model-governance-settings-page">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>AI and model governance</h1>
          <p className={cn("mt-1 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Manage the workspace default execution profile and review governed model aliases used on reviews.
          </p>
        </div>
        <PageContextualHelpButton />
      </div>
      <ModelGovernanceAiUsageVocabularyRail currentSurfaceId="model-governance" />
      <ModelGovernanceSettingsCard />
    </div>
  );
}
