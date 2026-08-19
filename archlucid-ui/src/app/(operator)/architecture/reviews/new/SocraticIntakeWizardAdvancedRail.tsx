"use client";

import { DraftIntakeAdvancedSection } from "@/components/draft-intake/DraftIntakeAdvancedSection";
import { DraftIntakeReasoningPanel } from "@/components/draft-intake/DraftIntakeReasoningPanel";
import { DraftIntakeWhatIfBranchPanel } from "@/components/draft-intake/DraftIntakeWhatIfBranchPanel";
import type { BranchDraftResponse, DraftElicitationQuestion } from "@/types/draft-intake";

export type SocraticIntakeWizardAdvancedRailProps = {
  readonly draftId: string;
  readonly busy: boolean;
  readonly blocksLlmExecution: boolean;
  readonly freeTextIntent: string;
  readonly businessOutcome: string;
  readonly systemName: string;
  readonly allQuestions: DraftElicitationQuestion[];
  readonly pendingQuestions: DraftElicitationQuestion[];
  readonly onBranched: (response: BranchDraftResponse) => void;
};

/** Optional reasoning and what-if branch tools — collapsed by default on step 2. */
export function SocraticIntakeWizardAdvancedRail(props: SocraticIntakeWizardAdvancedRailProps) {
  return (
    <DraftIntakeAdvancedSection defaultOpen={false}>
      <DraftIntakeReasoningPanel
        draftId={props.draftId}
        disabled={props.busy || props.blocksLlmExecution}
        embedded
      />
      <DraftIntakeWhatIfBranchPanel
        draftId={props.draftId}
        intent={props.freeTextIntent}
        outcome={props.businessOutcome}
        systemName={props.systemName}
        questionOptions={props.allQuestions}
        suppressQuestionAnswerOverride={props.pendingQuestions.length > 0}
        disabled={props.busy}
        onBranched={props.onBranched}
      />
    </DraftIntakeAdvancedSection>
  );
}
