import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    usePathname: () => "/administration/extract-upload",
  });
});

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" }),
}));

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (init: RequestInit) => init,
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

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

describe("ExtractUploadSettingsPageClient (SecureNow)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("renders SecureNow-branded extract and upload copy without ArchLucid leaks", async () => {
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

    await waitFor(() => {
      expect(screen.getByTestId("extract-upload-quick-start-panel")).toBeInTheDocument();
    });

    const pageText = screen.getByTestId("extract-upload-settings-page").textContent ?? "";

    expect(pageText).toContain("SecureNow checkout");
    expect(pageText).not.toMatch(/\bArchLucid\b/);
    expect(pageText).toContain("cloud inventory packager script");
  });
});
