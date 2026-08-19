"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type HelpMarkdownInlineCodeProps = {
  readonly code: string;
};

/** Inline command snippet with one-click copy for help runbooks. */
export function HelpMarkdownInlineCode(props: HelpMarkdownInlineCodeProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(props.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [props.code]);

  return (
    <span className="group relative inline-flex max-w-full items-center gap-1 align-bottom">
      <code
        className={cn(
          "inline-block max-w-full overflow-x-auto whitespace-nowrap rounded bg-neutral-100 px-1 py-0.5 font-mono text-[0.9em] text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100",
        )}
      >
        {props.code}
      </code>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "h-6 gap-1 px-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
          OPERATOR_TYPOGRAPHY.micro,
        )}
        onClick={() => {
          void handleCopy();
        }}
        aria-label={copied ? `Copied ${props.code}` : `Copy ${props.code}`}
      >
        {copied ? <Check className="h-3 w-3" aria-hidden /> : <Copy className="h-3 w-3" aria-hidden />}
        <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
      </Button>
    </span>
  );
}
