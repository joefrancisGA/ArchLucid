"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Copy } from "lucide-react";

import { OperatorErrorCallout } from "@/components/operator/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { parseAzureExtractorUploadFailure } from "@/lib/azure-extractor-upload-failure";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

type AzureExtractorUploadFailureCalloutProps = {
  fallbackMessage: string;
  problem: ApiProblemDetails | null;
  correlationId: string | null;
  /** Override root test id (wizard baseline field uses wizard-azure-zip-error). */
  rootTestId?: string;
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
  const rootTestId = props.rootTestId ?? "extract-upload-failure-callout";

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
    <div data-testid={rootTestId}>
      <OperatorErrorCallout>
      <strong>{presentation.heading}</strong>
      <p className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Error code:{" "}
        <code
          className="rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800"
          data-testid="extract-upload-error-code"
        >
          {presentation.errorCode}
        </code>
        {presentation.apiErrorCode ? (
          <>
            {" "}
            · API:{" "}
            <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800">
              {presentation.apiErrorCode}
            </code>
          </>
        ) : null}
      </p>
      <p className="mt-2">{presentation.guidance}</p>
      {presentation.errors.length > 0 ? (
        <ul className={cn("mt-2 list-inside list-disc", OPERATOR_TYPOGRAPHY.body)}>
          {presentation.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
      <p className={cn("mt-2.5", OPERATOR_TYPOGRAPHY.body)}>
        <Link
          href={inAppHelpHref("troubleshooting", "evidence-upload-failed")}
          className={OPERATOR_BODY_INLINE_LINK_CLASS}
          data-testid="extract-upload-troubleshooting-link"
        >
          Open evidence upload troubleshooting
        </Link>
      </p>
      {props.correlationId ? (
        <p className={cn("mt-2.5 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
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
    </div>
  );
}
