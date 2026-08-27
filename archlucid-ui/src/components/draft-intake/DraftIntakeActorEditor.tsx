"use client";

import { createEmptyActorDescriptor } from "@/lib/draft-intake-actor-suggestions";
import type { ActorSet } from "@/types/draft-intake";

import { DraftIntakeActorList } from "./DraftIntakeActorList";
import { DraftIntakeSuggestionPanel } from "./DraftIntakeSuggestionPanel";

export type DraftIntakeActorEditorProps = {
  readonly actorSet: ActorSet;
  readonly intentText: string;
  readonly minIntentChars?: number;
  readonly disabled?: boolean;
  readonly onChange: (actorSet: ActorSet) => void;
  /** When true, uses create-architecture helper copy and always allows manual adds. */
  readonly creationFlow?: boolean;
  /** Increment to prompt the unresolved-suggestions gate dialog (architecture draft Start review). */
  readonly suggestionGateRequestId?: number;
  readonly onUnresolvedSuggestionsChange?: (unresolved: boolean) => void;
};

/**
 * Inferred-then-confirmed actor set editor (ADR 0049) for guided intake step 0.
 */
export function DraftIntakeActorEditor(props: DraftIntakeActorEditorProps) {
  const panelDisabled = props.disabled === true;

  function addActor(): void {
    props.onChange({
      actors: [...props.actorSet.actors, createEmptyActorDescriptor()],
    });
  }

  return (
    <div className="draft-intake-actor-editor space-y-4" data-testid="draft-intake-actor-editor">
      <DraftIntakeSuggestionPanel
        actorSet={props.actorSet}
        intentText={props.intentText}
        minIntentChars={props.minIntentChars}
        panelDisabled={panelDisabled}
        creationFlow={props.creationFlow}
        suggestionGateRequestId={props.suggestionGateRequestId}
        onChange={props.onChange}
        onUnresolvedSuggestionsChange={props.onUnresolvedSuggestionsChange}
      />
      <DraftIntakeActorList
        actorSet={props.actorSet}
        panelDisabled={panelDisabled}
        onChange={props.onChange}
        onAddActor={addActor}
      />
    </div>
  );
}
