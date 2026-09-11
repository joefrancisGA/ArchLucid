import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";
import { INFRA_EVIDENCE_MERMAID_SERVER_PNG_UNAVAILABLE_MESSAGE } from "@/lib/infra-evidence/infra-evidence-mermaid-png-unavailable";

const {
  exportMermaidSourceToPngBlobMock,
  exportSanitizedMermaidSvgMarkupToPngBlobMock,
  fetchBrowserDownloadMock,
  triggerBrowserBlobDownloadMock,
} = vi.hoisted(() => ({
  exportMermaidSourceToPngBlobMock: vi.fn(),
  exportSanitizedMermaidSvgMarkupToPngBlobMock: vi.fn(),
  fetchBrowserDownloadMock: vi.fn(),
  triggerBrowserBlobDownloadMock: vi.fn(),
}));

vi.mock("@/lib/infra-evidence/export-mermaid-source-to-png", () => ({
  exportMermaidSourceToPngBlob: exportMermaidSourceToPngBlobMock,
  exportSanitizedMermaidSvgMarkupToPngBlob: exportSanitizedMermaidSvgMarkupToPngBlobMock,
}));

vi.mock("@/lib/api/downloads-blob-trigger-browser", () => ({
  fetchBrowserDownload: fetchBrowserDownloadMock,
  parseFilenameFromContentDisposition: () => null,
  triggerBrowserBlobDownload: triggerBrowserBlobDownloadMock,
}));

vi.mock("@/lib/api/http", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/http")>();

  return {
    ...actual,
    ensureOidcBearerReady: vi.fn(async () => undefined),
    isBrowser: () => true,
  };
});

describe("downloadInfraEvidenceMermaidPng", () => {
  beforeEach(() => {
    exportMermaidSourceToPngBlobMock.mockReset();
    exportSanitizedMermaidSvgMarkupToPngBlobMock.mockReset();
    fetchBrowserDownloadMock.mockReset();
    triggerBrowserBlobDownloadMock.mockReset();
    exportMermaidSourceToPngBlobMock.mockResolvedValue(new Blob(["png"], { type: "image/png" }));
    exportSanitizedMermaidSvgMarkupToPngBlobMock.mockResolvedValue(new Blob(["png"], { type: "image/png" }));
    triggerBrowserBlobDownloadMock.mockResolvedValue(undefined);
  });

  it("returns usedBrowserFallback=false when the server PNG download succeeds", async () => {
    fetchBrowserDownloadMock.mockResolvedValue({
      correlationId: "corr-1",
      response: {
        ok: true,
        blob: async () => new Blob(["png"], { type: "image/png" }),
        headers: new Headers({ "Content-Type": "image/png" }),
      },
    });

    const { downloadInfraEvidenceMermaidPng } = await import("@/lib/infra-evidence/infra-evidence-mermaid-api");
    const result = await downloadInfraEvidenceMermaidPng("11111111-1111-1111-1111-111111111111", {
      mode: "executive",
    });

    expect(result).toEqual({ usedBrowserFallback: false });
    expect(exportMermaidSourceToPngBlobMock).not.toHaveBeenCalled();
  });

  it("prefers sanitized viewer SVG for browser PNG fallback when available", async () => {
    fetchBrowserDownloadMock.mockResolvedValue({
      correlationId: "corr-2b",
      response: {
        ok: false,
        status: 400,
        headers: new Headers({ "content-type": "application/problem+json" }),
        text: async () => JSON.stringify({
          title: "Validation failed",
          detail: INFRA_EVIDENCE_MERMAID_SERVER_PNG_UNAVAILABLE_MESSAGE,
        }),
      },
    });

    const { downloadInfraEvidenceMermaidPng } = await import("@/lib/infra-evidence/infra-evidence-mermaid-api");
    const result = await downloadInfraEvidenceMermaidPng(
      "11111111-1111-1111-1111-111111111111",
      { mode: "executive" },
      {
        fallbackMermaidSource: "flowchart LR\n  A-->B",
        fallbackSvgMarkup: '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>',
        dark: false,
      },
    );

    expect(result).toEqual({ usedBrowserFallback: true });
    expect(exportSanitizedMermaidSvgMarkupToPngBlobMock).toHaveBeenCalledTimes(1);
    expect(exportMermaidSourceToPngBlobMock).not.toHaveBeenCalled();
  });

  it("falls back to browser PNG when the server rasterizer is unavailable", async () => {
    fetchBrowserDownloadMock.mockResolvedValue({
      correlationId: "corr-2",
      response: {
        ok: false,
        status: 400,
        headers: new Headers({ "content-type": "application/problem+json" }),
        text: async () => JSON.stringify({
          title: "Validation failed",
          detail: INFRA_EVIDENCE_MERMAID_SERVER_PNG_UNAVAILABLE_MESSAGE,
        }),
      },
    });

    const { downloadInfraEvidenceMermaidPng } = await import("@/lib/infra-evidence/infra-evidence-mermaid-api");
    const result = await downloadInfraEvidenceMermaidPng(
      "11111111-1111-1111-1111-111111111111",
      { mode: "executive" },
      { fallbackMermaidSource: "flowchart LR\n  A-->B", dark: false },
    );

    expect(result).toEqual({ usedBrowserFallback: true });
    expect(exportMermaidSourceToPngBlobMock).toHaveBeenCalledTimes(1);
    expect(triggerBrowserBlobDownloadMock).toHaveBeenCalledTimes(1);
  });

  it("rethrows non-unavailable server errors", async () => {
    fetchBrowserDownloadMock.mockResolvedValue({
      correlationId: "corr-3",
      response: {
        ok: false,
        status: 404,
        headers: new Headers({ "content-type": "application/problem+json" }),
        text: async () => JSON.stringify({
          title: "Not found",
          detail: "Snapshot missing.",
        }),
      },
    });

    const { downloadInfraEvidenceMermaidPng } = await import("@/lib/infra-evidence/infra-evidence-mermaid-api");

    await expect(
      downloadInfraEvidenceMermaidPng(
        "11111111-1111-1111-1111-111111111111",
        { mode: "executive" },
        { fallbackMermaidSource: "flowchart LR\n  A-->B" },
      ),
    ).rejects.toBeInstanceOf(ApiRequestError);
  });
});
