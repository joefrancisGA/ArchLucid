"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

type TechnicalIdDisclosureProps = {
  readonly label: string;
  readonly value: string | null | undefined;
};

/** Hides raw IDs behind a disclosure toggle in buyer/executive shells. */
export function TechnicalIdDisclosure(props: TechnicalIdDisclosureProps) {
  const [open, setOpen] = useState(false);
  const trimmed = (props.value ?? "").trim();
  const buyerPolished = isBuyerPolishedOperatorShellEnv();

  if (trimmed.length === 0) {
    return <span className="text-neutral-500">—</span>;
  }

  if (!buyerPolished) {
    return <code className="break-all rounded bg-neutral-100 px-1 font-mono text-xs dark:bg-neutral-800">{trimmed}</code>;
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="text-sm text-neutral-700 dark:text-neutral-300">{props.label}</span>
      {open ? (
        <code className="break-all rounded bg-neutral-100 px-1 font-mono text-xs dark:bg-neutral-800">{trimmed}</code>
      ) : (
        <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setOpen(true)}>
          Show details
        </Button>
      )}
    </span>
  );
}
