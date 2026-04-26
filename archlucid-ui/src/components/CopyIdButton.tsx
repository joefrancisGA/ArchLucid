"use client";

import { Copy } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";

export type CopyIdButtonProps = {
  value: string;
  /** Defaults to `Copy identifier`. */
  "aria-label"?: string;
};

/**
 * Copies a UUID-like identifier to the clipboard (best-effort; private mode may fail silently).
 */
export function CopyIdButton({ value, "aria-label": ariaLabel }: CopyIdButtonProps) {
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
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0 text-neutral-600 dark:text-neutral-400"
      aria-label={ariaLabel ?? "Copy identifier"}
      title={copied ? "Copied" : "Copy"}
      onClick={() => {
        void onCopy();
      }}
    >
      <Copy className="size-3.5" aria-hidden />
    </Button>
  );
}
