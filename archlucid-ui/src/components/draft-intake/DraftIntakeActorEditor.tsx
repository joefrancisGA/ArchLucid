"use client";
import { cn } from "@/lib/utils";
import {
  INLINE_GUIDANCE_LABEL_CLASS,
  OPERATOR_FORM_FIELD_HELPER_CLASS,
  OPERATOR_FORM_FIELD_LABEL_CLASS,
  OPERATOR_FORM_FIELD_STACK_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";

import { useEffect, useMemo, useState } from "react";

import { InlineGuidanceLabel } from "@/components/InlineGuidanceLabel";
import { Button } from "@/components/ui/button";
import { DismissControl } from "@/components/usability/DismissControl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACTOR_KIND_OPTIONS,
  formatSuggestedActorLabel,
  getInteractionContractOptions,
  resolveActorCardHeadingParts,
  TRUST_ORIGIN_OPTIONS,
} from "@/lib/draft-intake-actor-labels";
import {
  actorIdentityKey,
  buildSuggestedActorsFromIntent,
  createEmptyActorDescriptor,
  filterNewActorSuggestions,
  MIN_INTENT_CHARS_FOR_ACTOR_SUGGESTIONS,
} from "@/lib/draft-intake-actor-suggestions";
import {
  GUIDED_INTAKE_ACTORS_EMPTY_STATE,
  GUIDED_INTAKE_ACTORS_SECTION_HEADING,
  GUIDED_INTAKE_ADD_ACTOR_BUTTON,
  GUIDED_INTAKE_ADD_ANOTHER_ACTOR_BUTTON,
  GUIDED_INTAKE_ADD_SELECTED_ACTORS_BUTTON,
  GUIDED_INTAKE_CONFIRM_ACTOR_BUTTON,
  GUIDED_INTAKE_CREATION_PEOPLE_SYSTEMS_HINT,
  GUIDED_INTAKE_CREATION_SUGGEST_ACTORS_BUTTON,
  GUIDED_INTAKE_CREATION_SUGGEST_ACTORS_DISABLED_HINT,
  GUIDED_INTAKE_INTERACTION_TIMING_HINT,
  GUIDED_INTAKE_SUGGESTED_ACTORS_HEADING,
  GUIDED_INTAKE_SUGGEST_ACTORS_BUTTON,
  GUIDED_INTAKE_SUGGEST_ACTORS_DISABLED_HINT,
  GUIDED_INTAKE_TRUST_BOUNDARY_HINT,
  GUIDED_INTAKE_TRUST_ORIGIN_LABEL,
} from "@/lib/guided-intake-copy";
import type { ActorDescriptor, ActorSet } from "@/types/draft-intake";

export type DraftIntakeActorEditorProps = {
  readonly actorSet: ActorSet;
  readonly intentText: string;
  readonly minIntentChars?: number;
  readonly disabled?: boolean;
  readonly onChange: (actorSet: ActorSet) => void;
  /** When true, uses create-architecture helper copy and always allows manual adds. */
  readonly creationFlow?: boolean;
};

function updateActorAtIndex(
  actorSet: ActorSet,
  index: number,
  patch: Partial<ActorDescriptor>,
): ActorSet {
  const actors = actorSet.actors.map((actor, actorIndex): ActorDescriptor => {
    if (actorIndex !== index) {
      return actor;
    }

    return {
      ...actor,
      ...patch,
      origin: "Asserted",
      confidence: 100,
    };
  });

  return { actors };
}

function confirmActorAtIndex(actorSet: ActorSet, index: number): ActorSet {
  const actors = actorSet.actors.map((actor, actorIndex): ActorDescriptor => {
    if (actorIndex !== index) {
      return actor;
    }

    return {
      ...actor,
      origin: "Asserted",
      confidence: 100,
    };
  });

  return { actors };
}

/**
 * Inferred-then-confirmed actor set editor (ADR 0049) for guided intake step 0.
 */
export function DraftIntakeActorEditor(props: DraftIntakeActorEditorProps) {
  const panelDisabled = props.disabled === true;
  const minIntentChars = props.minIntentChars ?? MIN_INTENT_CHARS_FOR_ACTOR_SUGGESTIONS;
  const canSuggestFromIntent = props.intentText.trim().length >= minIntentChars;

  const [suggestionPanelOpen, setSuggestionPanelOpen] = useState(false);
  const [selectedSuggestionKeys, setSelectedSuggestionKeys] = useState<ReadonlySet<string>>(() => new Set());

  const pendingSuggestions = useMemo(() => {
    if (!suggestionPanelOpen) {
      return [];
    }

    return filterNewActorSuggestions(
      props.actorSet.actors,
      buildSuggestedActorsFromIntent(props.intentText),
    );
  }, [props.actorSet.actors, props.intentText, suggestionPanelOpen]);

  useEffect(() => {
    if (!suggestionPanelOpen) {
      return;
    }

    document
      .querySelector("[data-testid='draft-intake-actor-suggestions-panel']")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [suggestionPanelOpen]);

  function addActor(): void {
    props.onChange({
      actors: [...props.actorSet.actors, createEmptyActorDescriptor()],
    });
  }

  function removeActor(index: number): void {
    props.onChange({
      actors: props.actorSet.actors.filter((_, actorIndex) => actorIndex !== index),
    });
  }

  function openSuggestionPanel(): void {
    const freshSuggestions = filterNewActorSuggestions(
      props.actorSet.actors,
      buildSuggestedActorsFromIntent(props.intentText),
    );

    setSelectedSuggestionKeys(new Set(freshSuggestions.map((actor) => actorIdentityKey(actor))));
    setSuggestionPanelOpen(true);
  }

  function toggleSuggestionSelection(key: string, checked: boolean): void {
    setSelectedSuggestionKeys((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
      }

      return next;
    });
  }

  function addSelectedSuggestions(): void {
    const selectedActors = pendingSuggestions.filter((actor) =>
      selectedSuggestionKeys.has(actorIdentityKey(actor)),
    );

    if (selectedActors.length === 0) {
      return;
    }

    props.onChange({
      actors: [...props.actorSet.actors, ...selectedActors],
    });
    setSuggestionPanelOpen(false);
    setSelectedSuggestionKeys(new Set());
  }

  const addActorButtonLabel =
    props.actorSet.actors.length === 0
      ? GUIDED_INTAKE_ADD_ACTOR_BUTTON
      : GUIDED_INTAKE_ADD_ANOTHER_ACTOR_BUTTON;

  const isCreationFlow = props.creationFlow === true;
  const sectionHint = isCreationFlow
    ? GUIDED_INTAKE_CREATION_PEOPLE_SYSTEMS_HINT
    : GUIDED_INTAKE_TRUST_BOUNDARY_HINT;
  const suggestActorsButtonLabel = isCreationFlow
    ? GUIDED_INTAKE_CREATION_SUGGEST_ACTORS_BUTTON
    : GUIDED_INTAKE_SUGGEST_ACTORS_BUTTON;
  const suggestActorsDisabledHint = isCreationFlow
    ? GUIDED_INTAKE_CREATION_SUGGEST_ACTORS_DISABLED_HINT
    : GUIDED_INTAKE_SUGGEST_ACTORS_DISABLED_HINT;

  return (
    <div className="draft-intake-actor-editor space-y-4" data-testid="draft-intake-actor-editor">
      <div className={OPERATOR_FORM_FIELD_STACK_CLASS}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={cn("m-0", OPERATOR_FORM_FIELD_LABEL_CLASS)}>
            {GUIDED_INTAKE_ACTORS_SECTION_HEADING}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={panelDisabled || !canSuggestFromIntent}
            data-testid="draft-intake-actor-suggest"
            onClick={() => {
              openSuggestionPanel();
            }}
          >
            {suggestActorsButtonLabel}
          </Button>
        </div>
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_FORM_FIELD_HELPER_CLASS)}>
          {sectionHint}
        </p>
        {!canSuggestFromIntent ? (
          <p
            className={cn("m-0 text-neutral-500", OPERATOR_FORM_FIELD_HELPER_CLASS)}
            data-testid="draft-intake-actor-suggest-hint"
          >
            {suggestActorsDisabledHint}
          </p>
        ) : null}
      </div>

      {props.actorSet.actors.length === 0 ? (
        <p
          className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}
          data-testid="draft-intake-actor-empty"
        >
          {GUIDED_INTAKE_ACTORS_EMPTY_STATE}
        </p>
      ) : null}

      {suggestionPanelOpen ? (
        <div
          className="space-y-3 rounded-md border border-dashed border-neutral-300 p-3 dark:border-neutral-700"
          data-testid="draft-intake-actor-suggestions-panel"
        >
          <p className={cn("m-0", OPERATOR_FORM_FIELD_LABEL_CLASS)}>
            {GUIDED_INTAKE_SUGGESTED_ACTORS_HEADING}
          </p>
          {pendingSuggestions.length === 0 ? (
            <p className={cn("m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
              No new suggestions — add people or systems manually or edit the overview and try again.
            </p>
          ) : (
            <ul className="m-0 list-none space-y-2 p-0">
              {pendingSuggestions.map((actor) => {
                const key = actorIdentityKey(actor);

                return (
                  <li key={key}>
                    <label className={cn("flex cursor-pointer items-start gap-2", OPERATOR_TYPOGRAPHY.body)}>
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selectedSuggestionKeys.has(key)}
                        disabled={panelDisabled}
                        data-testid={`draft-intake-actor-suggestion-${key}`}
                        onChange={(event) => {
                          toggleSuggestionSelection(key, event.target.checked);
                        }}
                      />
                      <span>{formatSuggestedActorLabel(actor)}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="primary"
              disabled={panelDisabled || selectedSuggestionKeys.size === 0}
              data-testid="draft-intake-actor-add-selected"
              onClick={() => {
                addSelectedSuggestions();
              }}
            >
              {GUIDED_INTAKE_ADD_SELECTED_ACTORS_BUTTON}
            </Button>
            <DismissControl
              disabled={panelDisabled}
              data-testid="draft-intake-actor-dismiss-suggestions"
              onDismiss={() => {
                setSuggestionPanelOpen(false);
                setSelectedSuggestionKeys(new Set());
              }}
            />
          </div>
        </div>
      ) : null}

      {props.actorSet.actors.map((actor, index) => {
        const heading = resolveActorCardHeadingParts(actor, index);

        return (
        <div
          key={`actor-${index}-${actor.kind}-${actor.trustOrigin}-${actor.contract}`}
          className="space-y-3 rounded-md border p-3"
          data-testid="draft-intake-actor-row"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              {heading.keyHasColon ? (
                <InlineGuidanceLabel label={heading.keyLabel} />
              ) : (
                <strong className={INLINE_GUIDANCE_LABEL_CLASS}>{heading.keyLabel}</strong>
              )}
              {heading.valueText.length > 0 ? ` ${heading.valueText}` : null}
              {heading.provenanceSuffix}
            </p>
            <div className="flex flex-wrap gap-2">
              {actor.origin === "Inferred" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={panelDisabled}
                  data-testid={`draft-intake-actor-confirm-${index}`}
                  onClick={() => {
                    props.onChange(confirmActorAtIndex(props.actorSet, index));
                  }}
                >
                  {GUIDED_INTAKE_CONFIRM_ACTOR_BUTTON}
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={panelDisabled}
                data-testid={`draft-intake-actor-remove-${index}`}
                onClick={() => {
                  removeActor(index);
                }}
              >
                Remove
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor={`draft-intake-actor-label-${index}`}>Label (optional)</Label>
            <Input
              id={`draft-intake-actor-label-${index}`}
              value={actor.label ?? ""}
              disabled={panelDisabled}
              placeholder="Example: Claims adjuster, tenant admin, billing service"
              data-testid={`draft-intake-actor-label-${index}`}
              onChange={(event) => {
                props.onChange(
                  updateActorAtIndex(props.actorSet, index, { label: event.target.value }),
                );
              }}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className={OPERATOR_FORM_FIELD_STACK_CLASS}>
              <Label htmlFor={`draft-intake-actor-kind-${index}`}>Kind</Label>
              <Select
                value={actor.kind}
                disabled={panelDisabled}
                onValueChange={(value) => {
                  props.onChange(
                    updateActorAtIndex(props.actorSet, index, {
                      kind: value as ActorDescriptor["kind"],
                    }),
                  );
                }}
              >
                <SelectTrigger id={`draft-intake-actor-kind-${index}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTOR_KIND_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={OPERATOR_FORM_FIELD_STACK_CLASS}>
              <Label htmlFor={`draft-intake-actor-trust-${index}`}>{GUIDED_INTAKE_TRUST_ORIGIN_LABEL}</Label>
              <Select
                value={actor.trustOrigin}
                disabled={panelDisabled}
                onValueChange={(value) => {
                  props.onChange(
                    updateActorAtIndex(props.actorSet, index, {
                      trustOrigin: value as ActorDescriptor["trustOrigin"],
                    }),
                  );
                }}
              >
                <SelectTrigger id={`draft-intake-actor-trust-${index}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRUST_ORIGIN_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={OPERATOR_FORM_FIELD_STACK_CLASS}>
              <Label htmlFor={`draft-intake-actor-contract-${index}`}>Interaction</Label>
              <Select
                value={actor.contract}
                disabled={panelDisabled}
                onValueChange={(value) => {
                  props.onChange(
                    updateActorAtIndex(props.actorSet, index, {
                      contract: value as ActorDescriptor["contract"],
                    }),
                  );
                }}
              >
                <SelectTrigger
                  id={`draft-intake-actor-contract-${index}`}
                  aria-describedby={`draft-intake-actor-contract-hint-${index}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getInteractionContractOptions(actor.kind).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p
                id={`draft-intake-actor-contract-hint-${index}`}
                className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_FORM_FIELD_HELPER_CLASS)}
                data-testid={`draft-intake-actor-contract-hint-${index}`}
              >
                {GUIDED_INTAKE_INTERACTION_TIMING_HINT}
              </p>
            </div>
          </div>
        </div>
        );
      })}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={panelDisabled}
          data-testid="draft-intake-actor-add"
          onClick={() => {
            addActor();
          }}
        >
          {addActorButtonLabel}
        </Button>
      </div>
    </div>
  );
}
