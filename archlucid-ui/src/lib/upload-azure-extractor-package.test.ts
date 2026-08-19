import { describe, expect, it, vi } from "vitest";
import { strToU8, zipSync } from "fflate";

import { uploadAzureExtractorPackage } from "@/lib/upload-azure-extractor-package";

function buildValidAzureExtractorZipFile(): File {
  const bytes = zipSync({
    "manifest.json": strToU8(
      JSON.stringify({
        schemaVersion: 1,
        scriptVersion: "0.2.0",
        collectionTimestamp: "2026-05-17T12:00:00.000Z",
        subscriptionId: "11111111-1111-1111-1111-111111111111",
        scope: "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/RgName",
      }),
    ),
    "resources.json": strToU8(JSON.stringify([])),
  });

  return new File([bytes], "archlucid-azure-package.zip", { type: "application/zip" });
}

describe("uploadAzureExtractorPackage", () => {
  it("returns client validation error without calling the API when resources.json is missing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const bytes = zipSync({
      "manifest.json": strToU8(
        JSON.stringify({
          schemaVersion: 1,
          scriptVersion: "0.2.0",
          collectionTimestamp: "2026-05-17T12:00:00.000Z",
          subscriptionId: "11111111-1111-1111-1111-111111111111",
          scope: "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/RgName",
        }),
      ),
    });
    const file = new File([bytes], "invalid.zip", { type: "application/zip" });

    const result = await uploadAzureExtractorPackage(file);

    expect(result.ok).toBe(false);

    if (result.ok) {
      return;
    }

    expect(result.message).toContain("resources.json");
    expect(fetchMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("uploads after client validation passes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ packageId: "pkg-123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await uploadAzureExtractorPackage(buildValidAzureExtractorZipFile(), {
      runId: "run-1",
    });

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();

    vi.unstubAllGlobals();
  });
});
