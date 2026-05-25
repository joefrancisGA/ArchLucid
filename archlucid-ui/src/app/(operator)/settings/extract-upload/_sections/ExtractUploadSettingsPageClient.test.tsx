import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

    const fileInput = screen.getByTestId("extract-upload-file-input");
    const file = new File(["not-a-zip"], "broken.zip", { type: "application/zip" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("extract-upload-failure-callout")).toBeInTheDocument();
    });

    expect(screen.getByTestId("extract-upload-error-code")).toHaveTextContent("AZURE_EXTRACTOR_INVALID_ZIP_ARCHIVE");
    expect(screen.getByTestId("extract-upload-troubleshooting-link")).toHaveAttribute("href", expect.stringContaining("AZURE_EXTRACTOR.md"));
    expect(screen.getByText("Invalid ZIP archive")).toBeInTheDocument();
  });
});
