"use client";

import { useCallback, useState } from "react";
import { Copy } from "lucide-react";

import { OperatorErrorCallout } from "@/components/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { parseAzureExtractorUploadFailure } from "@/lib/azure-extractor-upload-failure";

type AzureExtractorUploadFailureCalloutProps = {
  fallbackMessage: string;
  problem: ApiProblemDetails | null;
  correlationId: string | null;
};

/** Actionable extractor upload failure with validation guidance and support copy payload. */
export function AzureExtractorUploadFailureCallout(props: AzureExtractorUploadFailureCalloutProps) {
  const presentation = parseAzureExtractorUploadFailure(
    props.problem,
    props.fallbackMessage,
    props.correlationId,
  );
  const copyText = JSON.stringify(presentation.copyPayload, null, 2);
  const [copied, setCopied] = useState(false);

  const onCopyDetails = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2_000);
    } catch {
      /* clipboard unavailable */
    }
  }, [copyText]);

  return (
    <OperatorErrorCallout data-testid="extract-upload-failure-callout">
      <strong>{presentation.heading}</strong>
      <p className="mt-2">{presentation.guidance}</p>
      {presentation.errors.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-sm">
          {presentation.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
      {props.correlationId ? (
        <p className="mt-2.5 text-xs text-neutral-600 dark:text-neutral-400">
          Correlation ID:{" "}
          <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800">{props.correlationId}</code>
        </p>
      ) : null}
      <div className="mt-2.5">
        <Button type="button" variant="outline" size="sm" onClick={() => void onCopyDetails()}>
          <Copy className="mr-1.5 size-3.5" aria-hidden />
          {copied ? "Copied" : "Copy error details"}
        </Button>
      </div>
    </OperatorErrorCallout>
  );
}
