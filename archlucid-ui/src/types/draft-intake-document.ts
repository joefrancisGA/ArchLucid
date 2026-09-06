import type { ActorSet } from "@/types/draft-intake-actors";
import type { TransparencyTrail } from "@/types/feasibility-verdict";

export type DraftRequestDocument = {
  freeTextIntent: string;
  systemName?: string;
  businessOutcome?: string;
  actorSet: ActorSet;
  parentDraftId?: string;
  questionAnswers?: Record<string, string>;
  requiredMustQuestionKeys?: string[];
  workflowIntent?: "create-architecture" | "start-review";
  transparencyTrail?: TransparencyTrail | null;
  structuredBrief?: {
    confirmedConstraints?: string[];
    confirmedAssumptions?: string[];
    confirmedRequiredCapabilities?: string[];
    suggestedConstraints?: string[];
    suggestedAssumptions?: string[];
    suggestedRequiredCapabilities?: string[];
    deniedConstraints?: string[];
    deniedAssumptions?: string[];
    deniedRequiredCapabilities?: string[];
    qualityAttribute?: string;
    failureModeNote?: string;
    suggestedFailureModeNote?: string;
    deniedFailureModeNote?: string;
    operationalOwner?: string;
  };
};
