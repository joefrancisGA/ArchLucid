import { describe, expect, it, vi } from "vitest";

import { downloadManifestMarkdownExport } from "./manifest-markdown-export-api";

describe("downloadManifestMarkdownExport", () => {
  it("does not save application/octet-stream as markdown", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response("not-markdown", {
          status: 200,
          headers: { "Content-Type": "application/octet-stream" },
        }),
      ),
    );
    const createObjectUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");

    await expect(downloadManifestMarkdownExport("manifest-1")).rejects.toThrow(/octet-stream/);

    expect(createObjectUrl).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
    createObjectUrl.mockRestore();
  });
});