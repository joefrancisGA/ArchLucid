"use client";

import type { ReactElement } from "react";

import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { Button } from "@/components/ui/button";
import {
  formatFindingDispositionConflictMessage,
  type FindingDispositionConflictDetail,
} from "@/lib/findings/finding-disposition-conflict";

export type FindingDispositionConflictPanelProps = {
  readonly conflict: FindingDispositionConflictDetail;
  readonly onReload: () => void;
  readonly onKeepMine?: () => void;
  readonly keepMineBusy?: boolean;
  readonly onDismiss?: () => void;
  readonly testId?: string;
  readonly message?: string;
};

/** Working inline recovery when disposition CAS returns 409 (ADR 0076 / RS-11). */
export function FindingDispositionConflictPanel(
  props: FindingDispositionConflictPanelProps,
): ReactElement {
  const testId = props.testId ?? "finding-disposition-conflict";

  return (
    <div className="space-y-2" data-testid={testId}>
      <OperatorMutationInlineError
        testId={`${testId}-message`}
        message={props.message ?? formatFindingDispositionConflictMessage(props.conflict)}
      />
      <div className="flex flex-wrap gap-2">
        {props.onKeepMine !== undefined ? (
          <Button
            type="button"
            size="sm"
            variant="default"
            disabled={props.keepMineBusy === true}
            data-testid={`${testId}-keep-mine`}
            onClick={() => {
              props.onKeepMine?.();
            }}
          >
            {props.keepMineBusy === true ? "Saving…" : "Keep mine"}
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant={props.onKeepMine !== undefined ? "outline" : "default"}
          data-testid={`${testId}-reload`}
          onClick={() => {
            props.onReload();
          }}
        >
          {props.onKeepMine !== undefined ? "Load theirs" : "Reload current disposition"}
        </Button>
        {props.onDismiss !== undefined ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-testid={`${testId}-dismiss`}
            onClick={() => {
              props.onDismiss?.();
            }}
          >
            Dismiss
          </Button>
        ) : null}
      </div>
    </div>
  );
}
