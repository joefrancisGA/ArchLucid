import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { downloadComparisonReplayPdf } from "./downloads-export-jobs";

vi.mock("./http", async (importOriginal) => ({
  ...await importOriginal<typeof import("./http")>(),
  ensureOidcBearerReady: vi.fn(async () => undefined),
  getBearerToken: () => null,
  isBrowser: () => true,
}));
vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (init: RequestInit) => init,
}));

const fetchResponse = vi.fn<typeof fetch>();
const clickDownload = vi.fn<(this: HTMLAnchorElement) => void>();

describe("downloadComparisonReplayPdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchResponse);
    const originalUrl = URL;
    vi.stubGlobal("URL", class extends originalUrl {
      static override createObjectURL = () => "blob:http://localhost/pdf";
      static override revokeObjectURL = () => {};
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(clickDownload);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("rejects a successful response that did not contain a PDF", async () => {
    fetchResponse.mockResolvedValueOnce(
      new Response("Replay processing status", {
        headers: { "Content-Type": "text/plain" },
      }),
    );

    await expect(downloadComparisonReplayPdf("comparison-1")).rejects.toThrow("unexpected content type");
    expect(clickDownload).not.toHaveBeenCalled();
  });

  it("preserves downloads of actual PDFs", async () => {
    fetchResponse.mockResolvedValueOnce(
      new Response("%PDF-1.7", {
        headers: { "Content-Type": "application/pdf" },
      }),
    );

    await downloadComparisonReplayPdf("comparison-1");
    expect(clickDownload).toHaveBeenCalledOnce();
    expect(clickDownload.mock.contexts[0].download).toBe("comparison-report-comparison-1.pdf");
  });
});
