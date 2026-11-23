import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAndDownloadComparisonPdf, downloadComparisonReplayPdf, downloadValueReportDocx } from "./downloads-export-jobs";

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

describe("downloadValueReportDocx", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchResponse);
    const originalUrl = URL;
    vi.stubGlobal("URL", class extends originalUrl {
      static override createObjectURL = () => "blob:http://localhost/docx";
      static override revokeObjectURL = () => {};
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(clickDownload);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("rejects a successful response that returned HTML instead of a DOCX", async () => {
    fetchResponse.mockResolvedValueOnce(
      new Response("<!doctype html><html></html>", {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }),
    );

    await expect(downloadValueReportDocx("2026-01-01T00:00:00Z", "2026-01-31T23:59:59Z")).rejects.toThrow(
      /unexpected content type|problem response/i,
    );
    expect(clickDownload).not.toHaveBeenCalled();
  });
});

describe("createAndDownloadComparisonPdf", () => {
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

  it("downloads the replay PDF when the summary response uses X-ArchLucid-ComparisonRecordId", async () => {
    fetchResponse
      .mockResolvedValueOnce(
        new Response('{"format":"markdown","summary":"# compare"}', {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-ArchLucid-ComparisonRecordId": "cmp-1",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response("%PDF-1.7", {
          status: 200,
          headers: { "Content-Type": "application/pdf" },
        }),
      );

    await createAndDownloadComparisonPdf("left-run", "right-run");

    expect(clickDownload).toHaveBeenCalledOnce();
    const replayUrl = String(fetchResponse.mock.calls[1]?.[0] ?? "");
    expect(replayUrl).toContain("/v1/architecture/comparisons/cmp-1/replay");
  });
});