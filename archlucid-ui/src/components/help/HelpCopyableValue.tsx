"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type HelpCopyableValueProps = {
  readonly label: string;
  readonly value: string;
  readonly testId?: string;
};

export function HelpCopyableValue(props: HelpCopyableValueProps): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const value = props.value.trim();
  const hasValue = value.length > 0;

  const copy = useCallback(async () => {
    if (!hasValue) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [hasValue, value]);

  return (
    <div className="space-y-1" data-testid={props.testId}>
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>{props.label}</p>
      <div className="flex flex-wrap items-start gap-2">
        <code
          className={cn(
            "min-w-0 flex-1 break-all rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5 dark:border-neutral-800 dark:bg-neutral-950",
            OPERATOR_TYPOGRAPHY.micro,
          )}
        >
          {hasValue ? value : "—"}
        </code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasValue}
          aria-label={hasValue ? `Copy ${props.label}` : `Copy ${props.label} unavailable`}
          onClick={() => void copy()}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
