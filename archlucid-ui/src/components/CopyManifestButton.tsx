"use client";

import { useState, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { fetchManifestJsonText } from "@/lib/manifest-json-fetch";

type CopyManifestButtonProps = {
  readonly runId: string;
  readonly className?: string;
};

/** One-click copy of the committed golden manifest JSON to the clipboard. */
export function CopyManifestButton(props: CopyManifestButtonProps): ReactElement {
  const { runId, className } = props;
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCopy = async (): Promise<void> => {
    setCopying(true);
    setError(null);

    try {
      const jsonText = await fetchManifestJsonText(runId);
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2_000);
    } catch (copyError) {
      const message =
        copyError instanceof Error
          ? copyError.message
          : "Could not copy manifest JSON — check connectivity and try again.";
      setError(message);
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className={className ?? "space-y-2"}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="copy-manifest-json-button"
        disabled={copying}
        className="border-neutral-300 dark:border-neutral-600"
        onClick={() => void onCopy()}
      >
        {copying ? "Preparing JSON…" : copied ? "Copied!" : "Copy manifest JSON"}
      </Button>
      {error !== null ? (
        <p
          role="alert"
          className="m-0 rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-rose-700/50"
          data-testid="copy-manifest-json-error"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
