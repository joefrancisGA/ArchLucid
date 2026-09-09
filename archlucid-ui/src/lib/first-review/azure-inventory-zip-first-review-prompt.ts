import { EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH } from "@/lib/extract-upload-settings-evidence-copy";
import type { HeldCheckLedgerRollupEntry } from "@/lib/findings/read-held-check-ledger-from-findings-snapshot";
import type { ProseAssumptionHeldCheckAsk } from "@/lib/findings/read-prose-assumption-held-check-asks-from-findings-snapshot";

export const FIRST_REVIEW_AZURE_INVENTORY_ZIP_PROMPT_TITLE = "Upload Azure inventory ZIP" as const;

export const FIRST_REVIEW_AZURE_INVENTORY_ZIP_PROMPT_BODY =
  "Run the read-only Azure packager in your tenant, then upload the resulting ZIP here. This is the V1 upload path — ArchLucid does not pull live subscription inventory unless your workspace has hosted extractor configured." as const;

const WORKSPACE_SCOPE_KEY = "__workspace__" as const;

const SKIP_STORAGE_PREFIX = "archlucid.firstReview.azureInventoryZip.skipped." as const;

const SKIP_STORAGE_SUFFIX = ".v1" as const;

export type FirstReviewAzureInventoryZipPromptScope = {
  readonly architectureRequestId?: string | null;
  readonly runId?: string | null;
};

export type ResolveFirstReviewAzureInventoryZipPromptInput = {
  readonly scope: FirstReviewAzureInventoryZipPromptScope;
  readonly manifestFinalized: boolean;
  readonly azureInventoryEvidencePresent: boolean;
  readonly heldCheckLedgerEntries?: readonly HeldCheckLedgerRollupEntry[];
  readonly proseAssumptionHeldCheckAsks?: readonly ProseAssumptionHeldCheckAsk[];
};

export type FirstReviewAzureInventoryZipPromptResolution = {
  readonly visible: boolean;
  readonly scopeKey: string;
  readonly uploadHref: string;
  readonly skipped: boolean;
};

export function resolveFirstReviewAzureInventoryZipPromptScopeKey(
  scope: FirstReviewAzureInventoryZipPromptScope,
): string {
  const architectureRequestId = scope.architectureRequestId?.trim() ?? "";

  if (architectureRequestId.length > 0) {
    return architectureRequestId;
  }

  const runId = scope.runId?.trim() ?? "";

  if (runId.length > 0) {
    return runId;
  }

  return WORKSPACE_SCOPE_KEY;
}

export function firstReviewAzureInventoryZipPromptSkipStorageKey(scopeKey: string): string {
  return `${SKIP_STORAGE_PREFIX}${scopeKey}${SKIP_STORAGE_SUFFIX}`;
}

export function readFirstReviewAzureInventoryZipPromptSkipped(scopeKey: string): boolean {
  if (typeof window === "undefined" || scopeKey.trim().length === 0) {
    return false;
  }

  try {
    return window.localStorage.getItem(firstReviewAzureInventoryZipPromptSkipStorageKey(scopeKey)) === "1";
  } catch {
    return false;
  }
}

export function writeFirstReviewAzureInventoryZipPromptSkipped(scopeKey: string, skipped: boolean): void {
  if (typeof window === "undefined" || scopeKey.trim().length === 0) {
    return;
  }

  try {
    window.localStorage.setItem(
      firstReviewAzureInventoryZipPromptSkipStorageKey(scopeKey),
      skipped ? "1" : "0",
    );
  } catch {
    /* ignore */
  }
}

export function buildAzureExtractUploadHref(runId?: string | null): string {
  const trimmedRunId = runId?.trim() ?? "";

  if (trimmedRunId.length === 0) {
    return EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH;
  }

  const params = new URLSearchParams({ runId: trimmedRunId });

  return `${EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH}?${params.toString()}`;
}

export function hasAzureInventoryZipHeldCheckAsk(input: {
  readonly heldCheckLedgerEntries?: readonly HeldCheckLedgerRollupEntry[];
  readonly proseAssumptionHeldCheckAsks?: readonly ProseAssumptionHeldCheckAsk[];
}): boolean {
  const ledgerHasAzure =
    (input.heldCheckLedgerEntries ?? []).some(
      (entry) => entry.inputCode === "azureInventoryZip" && entry.engineCount > 0,
    );

  if (ledgerHasAzure) {
    return true;
  }

  return (input.proseAssumptionHeldCheckAsks ?? []).some((ask) => ask.inputCode === "azureInventoryZip");
}

export function hasAzureInventoryZipEvidence(items: readonly { readonly kind: string }[]): boolean {
  return items.some((item) => item.kind === "Cloud inventory");
}

/** Soft first-review prompt — advisory only; finalize and engines stay fail-closed without inventory. */
export function resolveFirstReviewAzureInventoryZipPrompt(
  input: ResolveFirstReviewAzureInventoryZipPromptInput,
): FirstReviewAzureInventoryZipPromptResolution {
  const scopeKey = resolveFirstReviewAzureInventoryZipPromptScopeKey(input.scope);
  const skipped = readFirstReviewAzureInventoryZipPromptSkipped(scopeKey);
  const uploadHref = buildAzureExtractUploadHref(input.scope.runId);

  if (input.manifestFinalized) {
    return { visible: false, scopeKey, uploadHref, skipped };
  }

  if (input.azureInventoryEvidencePresent) {
    return { visible: false, scopeKey, uploadHref, skipped };
  }

  if (skipped) {
    return { visible: false, scopeKey, uploadHref, skipped: true };
  }

  if (
    hasAzureInventoryZipHeldCheckAsk({
      heldCheckLedgerEntries: input.heldCheckLedgerEntries,
      proseAssumptionHeldCheckAsks: input.proseAssumptionHeldCheckAsks,
    })
  ) {
    return { visible: false, scopeKey, uploadHref, skipped: false };
  }

  return { visible: true, scopeKey, uploadHref, skipped: false };
}
