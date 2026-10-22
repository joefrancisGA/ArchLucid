import {
  isConfirmedBriefEntry,
  type ArchitectureDraftStructuredBriefState,
} from "@/lib/architecture/architecture-draft-structured-brief";
import { buildArchitectureDraftSuggestionSourceText } from "@/lib/architecture/architecture-draft-structured-brief-suggestions";
import type { ActorSet } from "@/types/draft-intake";

/** Builds the searchable text used to infer L0 clarification answers during guided intake. */
export function buildGuidedIntakeClarificationInferenceCorpus(input: {
  readonly architectureOverview: string;
  readonly systemName?: string;
  readonly businessOutcome?: string;
  readonly structuredBrief: ArchitectureDraftStructuredBriefState;
  readonly actorSet?: ActorSet;
}): string {
  const sections: string[] = [];
  const baseText = buildArchitectureDraftSuggestionSourceText({
    architectureOverview: input.architectureOverview,
    systemName: input.systemName,
    businessOutcome: input.businessOutcome,
    structuredBrief: {
      confirmedConstraints: input.structuredBrief.confirmedConstraints,
      confirmedAssumptions: input.structuredBrief.confirmedAssumptions,
      confirmedRequiredCapabilities: input.structuredBrief.confirmedRequiredCapabilities,
      qualityAttribute: input.structuredBrief.qualityAttribute,
    },
  }).trim();

  if (baseText.length > 0) {
    sections.push(baseText);
  }

  const operationalOwner = input.structuredBrief.operationalOwner.trim();

  if (isConfirmedBriefEntry(operationalOwner)) {
    sections.push(`Operational owner: ${operationalOwner}`);
  }

  const failureModeNote = input.structuredBrief.failureModeNote.trim();

  if (isConfirmedBriefEntry(failureModeNote)) {
    sections.push(`Failure modes: ${failureModeNote}`);
  }

  const actors = input.actorSet?.actors ?? [];

  if (actors.length > 0) {
    sections.push(
      `Actors:\n${actors.map((actor) => `- ${actor.label} (${actor.kind})`).join("\n")}`,
    );
  }

  return sections.join("\n\n");
}
