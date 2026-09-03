import type { components } from "@/lib/openapi-schemas";
import type { ActorSet } from "@/types/draft-intake-actors";

export type CreateDraftRequest = {
  freeTextIntent?: string;
  priorRunId?: string | null;
  workflowIntent?: string | null;
};

export type PatchDraftRequest = {
  actorSet?: ActorSet | null;
  businessOutcome?: string | null;
  focusedPilotModeEnabled?: boolean | null;
  freeTextIntent?: string | null;
  structuredBrief?: components["schemas"]["ArchitectureDraftStructuredBrief"] | null;
  systemName?: string | null;
  workflowIntent?: string | null;
};

export type DraftIntakeReasonRequest = {
  message?: string;
};
