"use client";

import { Button } from "@/components/ui/button";
import {
  type DecisionReceiptContext,
  triggerDecisionReceiptDownload,
} from "@/lib/decision-receipt-export";

export type DecisionReceiptExportButtonProps = {
  readonly context: DecisionReceiptContext;
  readonly disabled?: boolean;
};

/** Downloads the ADR 0052 decision receipt JSON for a reasoned no or admission redirect. */
export function DecisionReceiptExportButton(props: DecisionReceiptExportButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={props.disabled === true}
      data-testid="decision-receipt-export"
      onClick={() => {
        triggerDecisionReceiptDownload(props.context);
      }}
    >
      Download decision receipt (JSON)
    </Button>
  );
}
