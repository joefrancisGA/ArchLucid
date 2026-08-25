"use client";

import { Ban } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DismissControl } from "@/components/usability/DismissControl";
import {
  GUIDED_INTAKE_ADD_SELECTED_ACTORS_BUTTON,
  GUIDED_INTAKE_ACTOR_SUGGESTIONS_GATE_DESCRIPTION,
  GUIDED_INTAKE_ACTOR_SUGGESTIONS_GATE_TITLE,
} from "@/lib/guided-intake-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type DraftIntakeActorSuggestionsGateDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly addSelectedDisabled: boolean;
  readonly panelDisabled: boolean;
  readonly onAddSelected: () => void;
  readonly onDismissSuggestions: () => void;
};

/** Blocks review start until the operator resolves the actor suggestion panel (TB-2006). */
export function DraftIntakeActorSuggestionsGateDialog(
  props: DraftIntakeActorSuggestionsGateDialogProps,
): React.JSX.Element {
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent data-testid="draft-intake-actor-suggestions-gate-dialog">
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <Ban
              className={cn("mt-0.5 h-5 w-5 shrink-0", DESIGN_TOKENS.calloutSeverity.blocked.iconClass)}
              aria-hidden
            />
            <div className={cn("min-w-0 space-y-2", OPERATOR_TYPOGRAPHY.body)}>
              <AlertDialogTitle>{GUIDED_INTAKE_ACTOR_SUGGESTIONS_GATE_TITLE}</AlertDialogTitle>
              <AlertDialogDescription>{GUIDED_INTAKE_ACTOR_SUGGESTIONS_GATE_DESCRIPTION}</AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <DismissControl
            variant="outline"
            disabled={props.panelDisabled}
            data-testid="draft-intake-actor-gate-dismiss"
            onDismiss={() => {
              props.onDismissSuggestions();
              props.onOpenChange(false);
            }}
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={props.panelDisabled || props.addSelectedDisabled}
            data-testid="draft-intake-actor-gate-add-selected"
            onClick={() => {
              props.onAddSelected();
              props.onOpenChange(false);
            }}
          >
            {GUIDED_INTAKE_ADD_SELECTED_ACTORS_BUTTON}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
