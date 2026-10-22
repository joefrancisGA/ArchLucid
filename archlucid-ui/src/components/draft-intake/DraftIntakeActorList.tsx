"use client";

import { cn } from "@/lib/utils";

import { InlineGuidanceLabel } from "@/components/InlineGuidanceLabel";
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
  getInteractionContractOptions,
  resolveActorCardHeadingParts,
  TRUST_ORIGIN_OPTIONS,
} from "@/lib/draft-intake-actor-labels";
import {
  GUIDED_INTAKE_ACTORS_EMPTY_STATE,
  GUIDED_INTAKE_ADD_ACTOR_BUTTON,
  GUIDED_INTAKE_ADD_ANOTHER_ACTOR_BUTTON,
  GUIDED_INTAKE_CONFIRM_ACTOR_BUTTON,
  GUIDED_INTAKE_INTERACTION_TIMING_HINT,
  GUIDED_INTAKE_TRUST_ORIGIN_LABEL,
} from "@/lib/guided-intake-copy";
import {
  INLINE_GUIDANCE_LABEL_CLASS,
  OPERATOR_FORM_FIELD_HELPER_CLASS,
  OPERATOR_FORM_FIELD_STACK_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import type { ActorDescriptor, ActorSet } from "@/types/draft-intake";

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

type DraftIntakeActorListProps = {
  readonly actorSet: ActorSet;
  readonly panelDisabled: boolean;
  readonly onChange: (actorSet: ActorSet) => void;
  readonly onAddActor: () => void;
};

export function DraftIntakeActorList(props: DraftIntakeActorListProps) {
  const { actorSet, panelDisabled, onChange, onAddActor } = props;

  function removeActor(index: number): void {
    onChange({
      actors: actorSet.actors.filter((_, actorIndex) => actorIndex !== index),
    });
  }

  const addActorButtonLabel =
    actorSet.actors.length === 0 ? GUIDED_INTAKE_ADD_ACTOR_BUTTON : GUIDED_INTAKE_ADD_ANOTHER_ACTOR_BUTTON;

  return (
    <>
      {actorSet.actors.length === 0 ? (
        <p
          className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}
          data-testid="draft-intake-actor-empty"
        >
          {GUIDED_INTAKE_ACTORS_EMPTY_STATE}
        </p>
      ) : null}

      {actorSet.actors.map((actor, index) => {
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
                      onChange(confirmActorAtIndex(actorSet, index));
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
                  onChange(updateActorAtIndex(actorSet, index, { label: event.target.value }));
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
                    onChange(
                      updateActorAtIndex(actorSet, index, {
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
                    onChange(
                      updateActorAtIndex(actorSet, index, {
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
                    onChange(
                      updateActorAtIndex(actorSet, index, {
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
            onAddActor();
          }}
        >
          {addActorButtonLabel}
        </Button>
      </div>
    </>
  );
}
