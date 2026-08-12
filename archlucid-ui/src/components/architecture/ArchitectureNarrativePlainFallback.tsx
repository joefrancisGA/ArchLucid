"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { stripDangerousMarkupForPlainTextDisplay } from "@/lib/architecture/architecture-narrative-presentation";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ArchitectureNarrativePlainFallbackProps = {
  readonly text: string;
};

/** Readable plain-text fallback when markdown rendering is unsafe or unsupported. */
export function ArchitectureNarrativePlainFallback(
  props: ArchitectureNarrativePlainFallbackProps,
): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const displayText = stripDangerousMarkupForPlainTextDisplay(props.text);

  const copyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(props.text);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  }, [props.text]);

  return (
    <div className="space-y-2" data-testid="architecture-narrative-plain-fallback">
      <pre
        className={cn(
          "m-0 max-h-[min(70vh,720px)] overflow-auto whitespace-pre-wrap break-words rounded-md border border-neutral-200 bg-neutral-50/80 p-3 text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-200",
          OPERATOR_TYPOGRAPHY.body,
        )}
      >
        {displayText}
      </pre>
      <Button type="button" variant="outline" size="sm" onClick={copyText}>
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
