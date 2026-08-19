"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import {
  MUTATION_UNDO_WINDOW_SECONDS,
  mutationSupportsUndoWindow,
  type GovernanceMutationReversibilityId,
} from "@/lib/mutation-reversibility-registry";

export type ReversibleMutationSuccessCalloutProps = {
  readonly message: string;
  readonly mutationId: GovernanceMutationReversibilityId;
  readonly testId?: string;
  readonly className?: string;
  readonly onDismiss?: () => void;
  readonly onUndo?: () => void | Promise<void>;
  readonly undoBusy?: boolean;
};

/** Durable success with optional short undo window for reversible governance mutations (TB-2148). */
export function ReversibleMutationSuccessCallout(
  props: ReversibleMutationSuccessCalloutProps,
): React.JSX.Element {
  const [undoVisible, setUndoVisible] = useState(
    mutationSupportsUndoWindow(props.mutationId) && props.onUndo !== undefined,
  );

  useEffect(() => {
    if (!undoVisible) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setUndoVisible(false);
    }, MUTATION_UNDO_WINDOW_SECONDS * 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [undoVisible]);

  const showUndo = undoVisible && props.onUndo !== undefined;

  return (
    <div className={props.className} data-testid={props.testId ?? "reversible-mutation-success-callout"}>
      <OperatorSuccessCallout message={props.message} onDismiss={props.onDismiss} />
      {showUndo ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={props.undoBusy === true}
            data-testid={`${props.testId ?? "reversible-mutation-success-callout"}-undo`}
            onClick={() => {
              void props.onUndo?.();
            }}
          >
            {props.undoBusy === true ? "Undoing…" : "Undo"}
          </Button>
          <p className="m-0 text-sm text-al-text-secondary">
            Available for {MUTATION_UNDO_WINDOW_SECONDS} seconds
          </p>
        </div>
      ) : null}
    </div>
  );
}
