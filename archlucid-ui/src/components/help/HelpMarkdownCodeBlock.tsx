"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type HelpMarkdownCodeBlockProps = {
  readonly code: string;
  readonly language?: string;
};

/** Fenced code block for in-app help with horizontal scroll and copy. */
export function HelpMarkdownCodeBlock(props: HelpMarkdownCodeBlockProps): React.JSX.Element {
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
    <div className="relative my-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-2 top-2 h-7 gap-1 px-2 text-xs text-neutral-600 dark:text-neutral-300"
        onClick={() => {
          void handleCopy();
        }}
        aria-label={copied ? "Copied" : "Copy code"}
      >
        {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
        {copied ? "Copied" : "Copy"}
      </Button>
      <pre
        className={cn(
          "max-w-full overflow-x-auto rounded-md border border-neutral-200 bg-neutral-50 p-3 pr-16 text-sm leading-relaxed dark:border-neutral-700 dark:bg-neutral-900/80",
        )}
      >
        <code className="font-mono text-neutral-900 dark:text-neutral-100">{props.code}</code>
      </pre>
      {props.language !== undefined && props.language.length > 0 ? (
        <span className="sr-only">{`Language: ${props.language}`}</span>
      ) : null}
    </div>
  );
}
