import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { strToU8, zipSync } from "fflate";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (init: RequestInit) => init,
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

import { ExtractUploadSettingsPageClient } from "./ExtractUploadSettingsPageClient";

describe("ExtractUploadSettingsPageClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("renders structured upload failure with semantic error code and doc link", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("workspace-baseline-artifacts") || url.includes("Get-ArchLucidAzurePackage.ps1")) {
        return new Response("{}", { status: 404 });
      }

      if (url.includes("/v1/azure-extractor/upload") && init?.method === "POST") {
        return new Response(
          JSON.stringify({
            type: "https://archlucid.net/problems/validation-failed",
            title: "Bad Request",
            status: 400,
            detail: "Uploaded payload is not a valid ZIP archive.",
            errorCode: "VALIDATION_FAILED",
            failureKind: "archive",
            errors: ["Uploaded payload is not a valid ZIP archive."],
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "X-Correlation-ID": "corr-upload-1",
            },
          },
        );
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ExtractUploadSettingsPageClient />);

    const fileInput = screen.getByTestId("extract-upload-drop-zone-input");
    const bytes = zipSync({
      "manifest.json": strToU8(
        JSON.stringify({
          schemaVersion: 1,
          scriptVersion: "1.0.0",
          collectionTimestamp: "2026-01-01T00:00:00Z",
          subscriptionId: "11111111-1111-1111-1111-111111111111",
          scope: "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg",
        }),
      ),
    });
    const file = new File([bytes], "broken.zip", { type: "application/zip" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("extract-upload-failure-callout")).toBeInTheDocument();
    });

    expect(screen.getByTestId("extract-upload-error-code")).toHaveTextContent("AZURE_EXTRACTOR_INVALID_ZIP_ARCHIVE");
    expect(screen.getByTestId("extract-upload-troubleshooting-link")).toHaveAttribute("href", expect.stringContaining("AZURE_EXTRACTOR.md"));
    expect(screen.getByText("Invalid ZIP archive")).toBeInTheDocument();
  });

  it("blocks unsupported schemaVersion client-side without calling upload API", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("workspace-baseline-artifacts") || url.includes("Get-ArchLucidAzurePackage.ps1")) {
        return new Response("{}", { status: 404 });
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ExtractUploadSettingsPageClient />);

    const fileInput = screen.getByTestId("extract-upload-drop-zone-input");
    const bytes = zipSync({
      "manifest.json": strToU8(
        JSON.stringify({
          schemaVersion: 2,
          scriptVersion: "1.0.0",
          collectionTimestamp: "2026-01-01T00:00:00Z",
          subscriptionId: "11111111-1111-1111-1111-111111111111",
          scope: "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg",
        }),
      ),
    });
    const file = new File([bytes], "legacy.zip", { type: "application/zip" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Required schemaVersion is 1/i)).toBeInTheDocument();
    });

    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining("/v1/azure-extractor/upload"), expect.anything());
  });
});
