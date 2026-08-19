import { describe, expect, it, vi } from "vitest";
import { strToU8, zipSync } from "fflate";

import { uploadTier1InventoryPackage } from "@/lib/upload-tier1-inventory-package";
import { uploadWizardPendingInventoryEvidence } from "@/lib/wizard-pending-evidence-upload";

function buildAwsInventoryZipFile(): File {
  const bytes = zipSync({
    "manifest.json": strToU8(
      JSON.stringify({
        schemaVersion: 1,
        scriptVersion: "0.1.0",
        collectionTimestamp: "2026-05-17T12:00:00.000Z",
        accountId: "123456789012",
        scope: "us-east-1",
      }),
    ),
    "resources.json": strToU8(JSON.stringify([])),
  });

  return new File([bytes], "archlucid-aws-package.zip", { type: "application/zip" });
}

describe("uploadWizardPendingInventoryEvidence (TB-2246)", () => {
  it("posts Aws inventory ZIPs to the Aws extractor upload endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ packageId: "aws-pkg-1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const file = buildAwsInventoryZipFile();
    const result = await uploadWizardPendingInventoryEvidence("run-1", "aws", file);

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/api/proxy/v1/extractor/aws/upload");
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("runId=run-1");

    vi.unstubAllGlobals();
  });
});

describe("uploadTier1InventoryPackage", () => {
  it("posts Gcp inventory ZIPs to the Gcp extractor upload endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ packageId: "gcp-pkg-1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const bytes = zipSync({
      "manifest.json": strToU8(
        JSON.stringify({
          schemaVersion: 1,
          scriptVersion: "0.1.0",
          collectionTimestamp: "2026-05-17T12:00:00.000Z",
          projectId: "demo-project",
        }),
      ),
      "resources.json": strToU8(JSON.stringify([])),
    });
    const file = new File([bytes], "archlucid-gcp-package.zip", { type: "application/zip" });

    const result = await uploadTier1InventoryPackage("gcp", file, { runId: "run-2" });

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/api/proxy/v1/extractor/gcp/upload");
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("runId=run-2");

    vi.unstubAllGlobals();
  });
});
