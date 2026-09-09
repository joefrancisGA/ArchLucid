"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { HeldCheckLedgerRollupEntry } from "@/lib/findings/read-held-check-ledger-from-findings-snapshot";
import type { ProseAssumptionHeldCheckAsk } from "@/lib/findings/read-prose-assumption-held-check-asks-from-findings-snapshot";
import {
  FIRST_REVIEW_AZURE_INVENTORY_ZIP_PROMPT_BODY,
  FIRST_REVIEW_AZURE_INVENTORY_ZIP_PROMPT_TITLE,
  resolveFirstReviewAzureInventoryZipPrompt,
  writeFirstReviewAzureInventoryZipPromptSkipped,
} from "@/lib/first-review/azure-inventory-zip-first-review-prompt";
import { cn } from "@/lib/utils";

const SKIP_CHANGED_EVENT = "archlucid-first-review-azure-inventory-zip-prompt-changed";

const skipListeners = new Set<() => void>();

function subscribeAzureInventoryZipPromptSkip(onStoreChange: () => void): () => void {
  skipListeners.add(onStoreChange);

  return () => {
    skipListeners.delete(onStoreChange);
  };
}

function emitAzureInventoryZipPromptSkipChanged(): void {
  for (const listener of skipListeners) {
    listener();
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SKIP_CHANGED_EVENT));
  }
}

function getAzureInventoryZipPromptSkipSnapshot(): string {
  return typeof window === "undefined" ? "" : "hydrated";
}

function getAzureInventoryZipPromptSkipServerSnapshot(): string {
  return "";
}

export type FirstReviewAzureInventoryZipPromptStripProps = {
  readonly runId: string;
  readonly architectureRequestId?: string | null;
  readonly manifestFinalized: boolean;
  readonly azureInventoryEvidencePresent: boolean;
  readonly heldCheckLedgerEntries?: readonly HeldCheckLedgerRollupEntry[];
  readonly proseAssumptionHeldCheckAsks?: readonly ProseAssumptionHeldCheckAsk[];
};

/** QR-10 / TB-645: skippable Azure inventory ZIP ask on first review — not a hard gate. */
export function FirstReviewAzureInventoryZipPromptStrip(
  props: FirstReviewAzureInventoryZipPromptStripProps,
): React.JSX.Element | null {
  useSyncExternalStore(
    subscribeAzureInventoryZipPromptSkip,
    getAzureInventoryZipPromptSkipSnapshot,
    getAzureInventoryZipPromptSkipServerSnapshot,
  );
  const [skipRevision, setSkipRevision] = useState(0);

  const resolution = useMemo(
    () =>
      resolveFirstReviewAzureInventoryZipPrompt({
        scope: {
          architectureRequestId: props.architectureRequestId,
          runId: props.runId,
        },
        manifestFinalized: props.manifestFinalized,
        azureInventoryEvidencePresent: props.azureInventoryEvidencePresent,
        heldCheckLedgerEntries: props.heldCheckLedgerEntries,
        proseAssumptionHeldCheckAsks: props.proseAssumptionHeldCheckAsks,
      }),
    [
      props.architectureRequestId,
      props.azureInventoryEvidencePresent,
      props.heldCheckLedgerEntries,
      props.manifestFinalized,
      props.proseAssumptionHeldCheckAsks,
      props.runId,
      skipRevision,
    ],
  );

  const onSkip = useCallback(() => {
    writeFirstReviewAzureInventoryZipPromptSkipped(resolution.scopeKey, true);
    emitAzureInventoryZipPromptSkipChanged();
    setSkipRevision((value) => value + 1);
  }, [resolution.scopeKey]);

  if (!resolution.visible) {
    return null;
  }

  return (
    <section
      className="rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-700"
      data-testid="first-review-azure-inventory-zip-prompt"
      aria-label={FIRST_REVIEW_AZURE_INVENTORY_ZIP_PROMPT_TITLE}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {FIRST_REVIEW_AZURE_INVENTORY_ZIP_PROMPT_TITLE}
          </p>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {FIRST_REVIEW_AZURE_INVENTORY_ZIP_PROMPT_BODY}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" variant="primary" size="sm" asChild>
            <Link href={resolution.uploadHref} data-testid="first-review-azure-inventory-zip-upload-link">
              Upload ZIP
            </Link>
          </Button>
          <button
            type="button"
            className={cn("font-medium text-neutral-600 underline dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            onClick={onSkip}
            data-testid="first-review-azure-inventory-zip-skip"
          >
            Skip for now
          </button>
        </div>
      </div>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Optional enrichment —{" "}
        <Link href="/help/evidence-intake" className={OPERATOR_LINK.inline}>
          evidence intake help
        </Link>
        . Skipping does not block finalize.
      </p>
    </section>
  );
}
