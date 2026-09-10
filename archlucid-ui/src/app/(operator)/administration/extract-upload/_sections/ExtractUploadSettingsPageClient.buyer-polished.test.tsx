import { render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    usePathname: () => "/administration/extract-upload",
  });
});

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

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import {
  EXTRACT_UPLOAD_SETTINGS_FIRST_VIEWPORT_TEST_ID,
  EXTRACT_UPLOAD_SETTINGS_PAGE_SUBTITLE,
  EXTRACT_UPLOAD_SETTINGS_PAGE_SUBTITLE_BUYER,
  EXTRACT_UPLOAD_SETTINGS_PRIMARY_CONTENT_ID,
  EXTRACT_UPLOAD_SETTINGS_SKIP_LINK_LABEL,
  EXTRACT_UPLOAD_SETTINGS_SKIP_TARGET_ID,
} from "@/lib/extract-upload-settings-page-copy";
import {
  EXTRACT_UPLOAD_SETTINGS_FOLLOW_UPS_TITLE,
  EXTRACT_UPLOAD_SETTINGS_ORIENTATION_SOURCES,
} from "@/lib/extract-upload-settings-evidence-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
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

  it("renders skip link, first-viewport band, orientation above workflow, buyer subtitle, and hides vocabulary rail", async () => {
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
      `#${EXTRACT_UPLOAD_SETTINGS_SKIP_TARGET_ID}`,
    );
    expect(screen.queryByTestId("extract-upload-page-breadcrumb")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByText(EXTRACT_UPLOAD_SETTINGS_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(EXTRACT_UPLOAD_SETTINGS_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByTestId("extract-upload-header-extractor-version")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: EXTRACT_UPLOAD_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByTestId("extract-upload-cloud-connections-vocabulary-rail")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("extract-upload-header-inventory-status")).toBeInTheDocument();
    });

    const primaryContent = screen.getByTestId(EXTRACT_UPLOAD_SETTINGS_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(EXTRACT_UPLOAD_SETTINGS_FIRST_VIEWPORT_TEST_ID);
    const orientationTop = screen.getByTestId("extract-upload-settings-orientation-top");
    const pageLayout = screen.getByTestId("extract-upload-page-layout");
    const sourcesSection = screen.getByTestId("extract-upload-settings-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(pageLayout);
    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(pageLayout) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const source of filterWhereToGoNextFollowUpLinks(EXTRACT_UPLOAD_SETTINGS_ORIENTATION_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
