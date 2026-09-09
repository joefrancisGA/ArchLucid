import { describe, expect, it, beforeEach } from "vitest";

import {
  buildAzureExtractUploadHref,
  firstReviewAzureInventoryZipPromptSkipStorageKey,
  hasAzureInventoryZipHeldCheckAsk,
  resolveFirstReviewAzureInventoryZipPrompt,
  writeFirstReviewAzureInventoryZipPromptSkipped,
} from "@/lib/first-review/azure-inventory-zip-first-review-prompt";

describe("azure-inventory-zip-first-review-prompt", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("builds extract-upload href with optional runId query", () => {
    expect(buildAzureExtractUploadHref(null)).toBe("/administration/extract-upload");
    expect(buildAzureExtractUploadHref("run-abc")).toBe(
      "/administration/extract-upload?runId=run-abc",
    );
  });

  it("shows the prompt before held-check ledger surfaces AzureInventoryZip", () => {
    const resolution = resolveFirstReviewAzureInventoryZipPrompt({
      scope: { architectureRequestId: "req-1", runId: "run-1" },
      manifestFinalized: false,
      azureInventoryEvidencePresent: false,
      heldCheckLedgerEntries: [],
      proseAssumptionHeldCheckAsks: [],
    });

    expect(resolution.visible).toBe(true);
    expect(resolution.uploadHref).toContain("runId=run-1");
  });

  it("hides the prompt when held-check ledger already asks for Azure inventory ZIP", () => {
    const resolution = resolveFirstReviewAzureInventoryZipPrompt({
      scope: { architectureRequestId: "req-1", runId: "run-1" },
      manifestFinalized: false,
      azureInventoryEvidencePresent: false,
      heldCheckLedgerEntries: [{ inputCode: "azureInventoryZip", engineCount: 2, engineTypes: ["x"] }],
      proseAssumptionHeldCheckAsks: [],
    });

    expect(resolution.visible).toBe(false);
    expect(
      hasAzureInventoryZipHeldCheckAsk({
        heldCheckLedgerEntries: [{ inputCode: "azureInventoryZip", engineCount: 1, engineTypes: ["y"] }],
      }),
    ).toBe(true);
  });

  it("persists skip per architecture scope and hides the prompt", () => {
    const scopeKey = "req-99";

    writeFirstReviewAzureInventoryZipPromptSkipped(scopeKey, true);

    expect(localStorage.getItem(firstReviewAzureInventoryZipPromptSkipStorageKey(scopeKey))).toBe("1");

    const resolution = resolveFirstReviewAzureInventoryZipPrompt({
      scope: { architectureRequestId: scopeKey, runId: "run-99" },
      manifestFinalized: false,
      azureInventoryEvidencePresent: false,
    });

    expect(resolution.visible).toBe(false);
    expect(resolution.skipped).toBe(true);
  });

  it("does not block finalize — finalized reviews never show the prompt", () => {
    const resolution = resolveFirstReviewAzureInventoryZipPrompt({
      scope: { architectureRequestId: "req-1", runId: "run-1" },
      manifestFinalized: true,
      azureInventoryEvidencePresent: false,
    });

    expect(resolution.visible).toBe(false);
  });
});
