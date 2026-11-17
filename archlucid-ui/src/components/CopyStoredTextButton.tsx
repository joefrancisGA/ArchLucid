"use client";

import { Copy } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";

export type CopyStoredTextButtonProps = {
  readonly value: string;
  readonly label?: string;
};

export function CopyStoredTextButton(props: CopyStoredTextButtonProps): React.JSX.Element {
  const { value, label = "Copy full stored text" } = props;
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return;
    }

    try {
      await navigator.clipboard.writeText(trimmed);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2_000);
    } catch {
      /* clipboard unavailable */
    }
  }, [value]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-7 shrink-0 text-neutral-600 dark:text-neutral-400"
      aria-label={label}
      data-testid="copy-stored-text-button"
      onClick={() => {
        void onCopy();
      }}
    >
      <Copy className="mr-1 size-3.5" aria-hidden />
      {copied ? "Copied" : label}
    </Button>
  );
}
