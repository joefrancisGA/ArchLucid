import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (init: RequestInit) => init,
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/ExtractUploadCloudConnectionsVocabularyRail", () => ({
  ExtractUploadCloudConnectionsVocabularyRail: () => (
    <div data-testid="extract-upload-cloud-connections-vocabulary-rail" />
  ),
}));

import {
  EXTRACT_UPLOAD_SETTINGS_PAGE_SUBTITLE,
  EXTRACT_UPLOAD_SETTINGS_PAGE_SUBTITLE_BUYER,
  EXTRACT_UPLOAD_SETTINGS_PRIMARY_CONTENT_ID,
  EXTRACT_UPLOAD_SETTINGS_SKIP_LINK_LABEL,
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

describe("ExtractUploadSettingsPageClient buyer-polished shell (ADX)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders skip link, breadcrumb, orientation above workflow, buyer subtitle, and hides vocabulary rail", async () => {
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

    expect(screen.getByRole("link", { name: EXTRACT_UPLOAD_SETTINGS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${EXTRACT_UPLOAD_SETTINGS_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("extract-upload-page-breadcrumb")).toBeInTheDocument();
    expect(screen.getByText(EXTRACT_UPLOAD_SETTINGS_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(EXTRACT_UPLOAD_SETTINGS_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByTestId("extract-upload-header-extractor-version")).not.toBeInTheDocument();
    expect(screen.getByTestId("extract-upload-settings-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("extract-upload-settings-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("extract-upload-cloud-connections-vocabulary-rail")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("extract-upload-header-inventory-status")).toBeInTheDocument();
    });

    const primaryContent = screen.getByTestId("extract-upload-settings-primary-content");
    const orderedLandmarks = ["extract-upload-settings-orientation-top", "extract-upload-page-layout"]
      .map((testId) => primaryContent.querySelector(`[data-testid="${testId}"]`))
      .filter((node): node is HTMLElement => node !== null)
      .map((node) => node.getAttribute("data-testid"));

    expect(orderedLandmarks).toEqual([
      "extract-upload-settings-orientation-top",
      "extract-upload-page-layout",
    ]);
  });
});
