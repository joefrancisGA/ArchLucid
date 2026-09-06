import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    usePathname: () => "/administration/developer",
  });
});

import { DeveloperSettingsPageClient } from "./DeveloperSettingsPageClient";
import {
  INTERNAL_DEVELOPER_TOOLS_ACCESS_NOTE,
  INTERNAL_DEVELOPER_TOOLS_CATALOG_GATE_NOTE,
  INTERNAL_DEVELOPER_TOOLS_INTRO,
  INTERNAL_DEVELOPER_TOOLS_INTERNAL_ONLY_TAG,
  INTERNAL_DEVELOPER_TOOLS_PAGE_TITLE,
  INTERNAL_DEVELOPER_TOOLS_SHIPPED_INVENTORY,
} from "./developer-settings-copy";
import { DEVELOPER_API_CONTRACTS_API_KEYS_COMPACT_LINE } from "@/lib/vocabulary/developer-api-contracts-api-keys-vocabulary";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: () => <button type="button">Page help</button>,
}));

describe("DeveloperSettingsPageClient", () => {
  it("surfaces only shipped internal developer tool widgets", () => {
    render(<DeveloperSettingsPageClient />);

    expect(screen.getByRole("heading", { level: 2, name: INTERNAL_DEVELOPER_TOOLS_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(INTERNAL_DEVELOPER_TOOLS_INTRO)).toBeInTheDocument();
    expect(screen.getByTestId("developer-settings-access-note")).toHaveTextContent(
      INTERNAL_DEVELOPER_TOOLS_ACCESS_NOTE,
    );
    expect(screen.getByText(INTERNAL_DEVELOPER_TOOLS_SHIPPED_INVENTORY[0])).toBeInTheDocument();
    expect(screen.getByTestId("authority-theme-dev-selector")).toBeInTheDocument();
    expect(screen.getByTestId("try-cli-demo-card")).toBeInTheDocument();
    expect(screen.getByTestId("developer-settings-build-identity-card")).toBeInTheDocument();
    expect(screen.getByTestId("developer-settings-sources")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^Diagnostics$/i })).not.toBeInTheDocument();
  });

  it("renders internal-only tag and gate note in the header", () => {
    render(<DeveloperSettingsPageClient />);

    expect(screen.queryByTestId("developer-settings-page-breadcrumb")).toBeNull();
    expect(screen.getByTestId("developer-settings-internal-only-tag")).toHaveTextContent(
      INTERNAL_DEVELOPER_TOOLS_INTERNAL_ONLY_TAG,
    );
    expect(screen.getByTestId("developer-settings-gate-note")).toHaveTextContent(
      INTERNAL_DEVELOPER_TOOLS_CATALOG_GATE_NOTE,
    );
  });

  it("places vocabulary rail under the header before tool cards", () => {
    render(<DeveloperSettingsPageClient />);

    const page = screen.getByTestId("developer-settings-page");
    expect(page).toHaveClass("w-full", "max-w-[62rem]");

    const vocabularyRail = screen.getByTestId("developer-api-contracts-api-keys-vocabulary");
    const buildIdentityCard = screen.getByTestId("developer-settings-build-identity-card");
    const themeSelector = screen.getByTestId("authority-theme-dev-selector");
    const cliCard = screen.getByTestId("try-cli-demo-card");
    const accessNote = screen.getByTestId("developer-settings-access-note");
    const orientationBottom = screen.getByTestId("developer-settings-orientation-bottom");

    expect(vocabularyRail.textContent ?? "").toContain(DEVELOPER_API_CONTRACTS_API_KEYS_COMPACT_LINE);
    expect(
      vocabularyRail.compareDocumentPosition(buildIdentityCard) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      buildIdentityCard.compareDocumentPosition(themeSelector) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      themeSelector.compareDocumentPosition(cliCard) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      cliCard.compareDocumentPosition(accessNote) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      accessNote.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Related surfaces" })).not.toBeInTheDocument();
  });

  it("uses h3 section headings under the page title", () => {
    render(<DeveloperSettingsPageClient />);

    expect(screen.getByRole("heading", { level: 3, name: "Build and environment" })).toBeInTheDocument();
    expect(screen.getByText("CI build")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Branded theme evaluation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Local CLI demo" })).toBeInTheDocument();
  });
});
