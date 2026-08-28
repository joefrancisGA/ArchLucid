"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

type TechnicalIdDisclosureProps = {
  readonly label: string;
  readonly value: string | null | undefined;
};

/** Hides raw IDs behind a disclosure toggle in buyer/sponsor shells. */
export function TechnicalIdDisclosure(props: TechnicalIdDisclosureProps) {
  const [open, setOpen] = useState(false);
  const trimmed = (props.value ?? "").trim();
  const buyerPolished = isBuyerPolishedOperatorShellEnv();

  if (trimmed.length === 0) {
    return <span className="text-neutral-500">—</span>;
  }

  if (!buyerPolished) {
    return <code className={cn("break-all rounded bg-neutral-100 px-1 font-mono dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.helper)}>{trimmed}</code>;
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className={cn("text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{props.label}</span>
      {open ? (
        <code className={cn("break-all rounded bg-neutral-100 px-1 font-mono dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.helper)}>{trimmed}</code>
      ) : (
        <Button type="button" size="sm" variant="outline" className="h-7 px-2" onClick={() => setOpen(true)}>
          Show details
        </Button>
      )}
    </span>
  );
}
