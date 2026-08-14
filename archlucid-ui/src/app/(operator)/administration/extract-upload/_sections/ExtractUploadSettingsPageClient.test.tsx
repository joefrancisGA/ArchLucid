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

import { PAGE_HELP_SHORT_TRIGGER_TEXT } from "@/components/usability/PageContextualHelpButton";
import {
  EXTRACT_UPLOAD_EVIDENCE_TRAIL_HREF,
  EXTRACT_UPLOAD_INVENTORY_ON_FILE_STATUS_LABEL,
  EXTRACT_UPLOAD_NO_INVENTORY_STATUS_LABEL,
} from "@/lib/extract-upload-settings-page-copy";
import { ExtractUploadSettingsPageClient } from "./ExtractUploadSettingsPageClient";

function baselineArtifactsResponse(payload: {
  hasBaselineArtifacts: boolean;
  extractorScriptVersion?: string | null;
}): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function scriptVersionResponse(version: string): Response {
  return new Response(`$scriptVersion = "${version}"`, { status: 200 });
}

describe("ExtractUploadSettingsPageClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("renders header short help trigger and workflow layout", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("workspace-baseline-artifacts")) {
        return baselineArtifactsResponse({ hasBaselineArtifacts: false, extractorScriptVersion: "1.0.0" });
      }

      if (url.includes("Get-ArchLucidAzurePackage.ps1")) {
        return scriptVersionResponse("1.0.0");
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ExtractUploadSettingsPageClient />);

    expect(screen.queryByTestId("extract-upload-page-breadcrumb")).toBeNull();
    expect(screen.getByTestId("page-contextual-help-button")).toHaveTextContent(PAGE_HELP_SHORT_TRIGGER_TEXT);
    expect(screen.getByTestId("extract-upload-page-layout")).toBeInTheDocument();
    expect(screen.getByTestId("extract-upload-page-aside")).toBeInTheDocument();
    expect(screen.getByTestId("extract-upload-evidence-trail-link")).toHaveAttribute(
      "href",
      EXTRACT_UPLOAD_EVIDENCE_TRAIL_HREF,
    );

    await waitFor(() => {
      expect(screen.getByTestId("extract-upload-header-inventory-status")).toHaveTextContent(
        EXTRACT_UPLOAD_NO_INVENTORY_STATUS_LABEL,
      );
    });
  });

  it("shows inventory-on-file status and extractor version metadata when baseline artifacts exist", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("workspace-baseline-artifacts")) {
        return baselineArtifactsResponse({ hasBaselineArtifacts: true, extractorScriptVersion: "2.4.1" });
      }

      if (url.includes("Get-ArchLucidAzurePackage.ps1")) {
        return scriptVersionResponse("2.4.1");
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ExtractUploadSettingsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("extract-upload-header-inventory-status")).toHaveTextContent(
        EXTRACT_UPLOAD_INVENTORY_ON_FILE_STATUS_LABEL,
      );
    });

    expect(screen.getByTestId("extract-upload-header-extractor-version")).toHaveTextContent("Extractor script: v2.4.1");
  });

  it("uses unbroken Step 1 and Step 2 numbering with demo in the aside", () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("workspace-baseline-artifacts") || url.includes("Get-ArchLucidAzurePackage.ps1")) {
        return new Response("{}", { status: 404 });
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ExtractUploadSettingsPageClient />);

    expect(screen.getByText("Step 1 — Collect inventory locally")).toBeInTheDocument();
    expect(screen.getByText("Step 2 — Upload ZIP")).toBeInTheDocument();
    expect(screen.queryByText("Step 3 — Upload ZIP")).not.toBeInTheDocument();
    expect(screen.getByTestId("extract-upload-demo-aside")).toBeInTheDocument();
    expect(screen.getByTestId("extract-upload-validate-disclosure")).toBeInTheDocument();
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
      "resources.json": strToU8("[]"),
    });
    const file = new File([bytes], "broken.zip", { type: "application/zip" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("extract-upload-failure-callout")).toBeInTheDocument();
    });

    expect(screen.getByTestId("extract-upload-error-code")).toHaveTextContent("AZURE_EXTRACTOR_INVALID_ZIP_ARCHIVE");
    expect(screen.getByTestId("extract-upload-troubleshooting-link")).toHaveAttribute(
      "href",
      "/help/troubleshooting#evidence-upload-failed",
    );
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
      "resources.json": strToU8("[]"),
    });
    const file = new File([bytes], "legacy.zip", { type: "application/zip" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("extract-upload-error-code")).toHaveTextContent(
        "AZURE_EXTRACTOR_UNSUPPORTED_SCHEMA_VERSION",
      );
    });

    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining("/v1/azure-extractor/upload"), expect.anything());
  });
});
