import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExtractUploadSettingsPageClient } from "@/app/(operator)/administration/extract-upload/_sections/ExtractUploadSettingsPageClient";
import { parseKeyCombo } from "@/hooks/useKeyboardShortcuts";

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

vi.mock("@/components/operator/OperatorNavAuthorityProvider", async () => {
  const { createOperatorNavAuthorityVitestMock } = await import("@/testing/operator-nav-authority-vitest-mock");

  return createOperatorNavAuthorityVitestMock();
});

function fireCombo(combo: string): void {
  const parsed = parseKeyCombo(combo);

  fireEvent.keyDown(window, {
    key: parsed.key,
    altKey: parsed.alt,
    ctrlKey: parsed.ctrl,
    metaKey: parsed.meta,
    shiftKey: parsed.shift,
    bubbles: true,
  });
}

describe("keyboard shortcuts extract-upload (integration)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes("workspace-baseline-artifacts") || url.includes("Get-ArchLucidAzurePackage.ps1")) {
          return new Response("{}", { status: 404 });
        }

        return new Response("not found", { status: 404 });
      }),
    );
  });

  it("documents extract-upload shortcuts in the page header disclosure", async () => {
    render(<ExtractUploadSettingsPageClient />);

    expect(screen.getByTestId("extract-upload-page-shortcuts")).toBeInTheDocument();
    expect(screen.getByTestId("extract-upload-page-shortcuts-entry-focus")).toBeInTheDocument();
    expect(screen.getByTestId("extract-upload-page-shortcuts-entry-copy")).toBeInTheDocument();
  });

  it("registers Ctrl+U shortcut handler without throwing", () => {
    render(<ExtractUploadSettingsPageClient />);

    expect(() => fireCombo("ctrl+u")).not.toThrow();
    expect(screen.getByTestId("extract-upload-drop-zone-surface")).toBeInTheDocument();
  });
});
