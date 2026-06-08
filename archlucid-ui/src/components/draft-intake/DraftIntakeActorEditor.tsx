"use client";

import { Button } from "@/components/ui/button";
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
  actorOriginLabel,
  INTERACTION_CONTRACT_OPTIONS,
  TRUST_ORIGIN_OPTIONS,
} from "@/lib/draft-intake-actor-labels";
import { createEmptyActorDescriptor } from "@/lib/draft-intake-actor-suggestions";
import type { ActorDescriptor, ActorSet } from "@/types/draft-intake";

export type DraftIntakeActorEditorProps = {
  readonly actorSet: ActorSet;
  readonly disabled?: boolean;
  readonly onChange: (actorSet: ActorSet) => void;
  readonly onResuggest?: () => void;
};

function updateActorAtIndex(
  actorSet: ActorSet,
  index: number,
  patch: Partial<ActorDescriptor>,
): ActorSet {
  const actors = actorSet.actors.map((actor, actorIndex) => {
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

  function removeActor(index: number): void {
    if (props.actorSet.actors.length <= 1) {
      return;
    }

    props.onChange({
      actors: props.actorSet.actors.filter((_, actorIndex) => actorIndex !== index),
    });
  }

  return (
    <div className="draft-intake-actor-editor space-y-4" data-testid="draft-intake-actor-editor">
      <div className="space-y-1">
        <p className="m-0 text-sm font-medium text-neutral-900 dark:text-neutral-100">Who uses this system?</p>
        <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
          Confirm or correct the suggested actors — missing a user type hides entire trust boundaries (ADR 0049).
        </p>
      </div>

      {props.actorSet.actors.map((actor, index) => (
        <div
          key={`actor-${index}-${actor.kind}-${actor.trustOrigin}`}
          className="space-y-3 rounded-md border p-3"
          data-testid="draft-intake-actor-row"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Actor {index + 1} · {actorOriginLabel(actor.origin)}
            </p>
            {props.actorSet.actors.length > 1 ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={panelDisabled}
                data-testid={`draft-intake-actor-remove-${index}`}
                onClick={() => {
                  removeActor(index);
                }}
              >
                Remove
              </Button>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`draft-intake-actor-label-${index}`}>Label (optional)</Label>
            <Input
              id={`draft-intake-actor-label-${index}`}
              value={actor.label ?? ""}
              disabled={panelDisabled}
              data-testid={`draft-intake-actor-label-${index}`}
              onChange={(event) => {
                props.onChange(
                  updateActorAtIndex(props.actorSet, index, { label: event.target.value }),
                );
              }}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
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

            <div className="space-y-2">
              <Label htmlFor={`draft-intake-actor-trust-${index}`}>Trust origin</Label>
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

            <div className="space-y-2">
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
                <SelectTrigger id={`draft-intake-actor-contract-${index}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERACTION_CONTRACT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ))}

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
          Add another actor
        </Button>
        {props.onResuggest !== undefined ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={panelDisabled}
            data-testid="draft-intake-actor-resuggest"
            onClick={() => {
              props.onResuggest?.();
            }}
          >
            Re-suggest from intent
          </Button>
        ) : null}
      </div>
    </div>
  );
}
