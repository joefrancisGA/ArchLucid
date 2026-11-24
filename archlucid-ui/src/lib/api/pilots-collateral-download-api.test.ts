import { describe, expect, it, vi } from "vitest";

import {
  downloadPilotFirstValueReportMarkdown,
  downloadSponsorReviewPacketMarkdown,
} from "./pilots-collateral-download-api";

describe("pilots collateral markdown exports", () => {
  it("does not save application/pdf as sponsor review packet markdown", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response("not-markdown", {
          status: 200,
          headers: { "Content-Type": "application/pdf" },
        }),
      ),
    );
    const createObjectUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");

    await expect(downloadSponsorReviewPacketMarkdown("run-1")).rejects.toThrow(/pdf/);

    expect(createObjectUrl).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
    createObjectUrl.mockRestore();
  });

  it("does not save application/pdf as first-value report markdown", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response("not-markdown", {
          status: 200,
          headers: { "Content-Type": "application/pdf" },
        }),
      ),
    );
    const createObjectUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");

    await expect(downloadPilotFirstValueReportMarkdown("run-1")).rejects.toThrow(/pdf/);

    expect(createObjectUrl).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
    createObjectUrl.mockRestore();
  });
});