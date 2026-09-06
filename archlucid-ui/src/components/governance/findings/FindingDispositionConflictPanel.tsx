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
  readonly onDismiss?: () => void;
  readonly testId?: string;
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
        title="Disposition conflict"
        message={formatFindingDispositionConflictMessage(props.conflict)}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="default"
          data-testid={`${testId}-reload`}
          onClick={() => {
            props.onReload();
          }}
        >
          Reload current disposition
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
