import { render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const usePathnameMock = vi.hoisted(() => vi.fn(() => "/"));

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    usePathname: () => usePathnameMock(),
  });
});

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/ApiKeysUsersVocabularyRail", () => ({
  ApiKeysUsersVocabularyRail: () => <div data-testid="api-keys-users-vocabulary-rail" />,
}));

vi.mock("@/components/WebhooksApiKeysVocabularyRail", () => ({
  WebhooksApiKeysVocabularyRail: () => <div data-testid="webhooks-api-keys-vocabulary-rail" />,
}));

vi.mock("@/components/DeveloperApiContractsApiKeysVocabularyRail", () => ({
  DeveloperApiContractsApiKeysVocabularyRail: () => (
    <div data-testid="developer-api-contracts-api-keys-vocabulary-rail" />
  ),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { ApiKeysSettingsPageClient } from "./ApiKeysSettingsPageClient";
import {
  API_KEYS_PAGE_SUBTITLE,
  API_KEYS_ENTERPRISE_ONLY_NOTICE,
} from "@/lib/api-keys-settings-copy";
import {
  API_KEYS_SETTINGS_FOLLOW_UPS_TITLE,
  API_KEYS_SETTINGS_SOURCES,
} from "@/lib/api-keys-settings-evidence-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import {
  API_KEYS_SETTINGS_FIRST_VIEWPORT_TEST_ID,
  API_KEYS_SETTINGS_PAGE_SUBTITLE_BUYER,
  API_KEYS_SETTINGS_PRIMARY_CONTENT_ID,
  API_KEYS_SETTINGS_SKIP_LINK_LABEL,
  API_KEYS_SETTINGS_SKIP_TARGET_ID,
} from "./api-keys-settings-page-copy";

vi.mock("@/lib/api-keys-settings-access", () => ({
  isApiKeysSettingsSurfaceEnabled: () => true,
}));

vi.mock("@/lib/internal-operator-env", () => ({
  isArchLucidInternalOperatorShellEnv: () => false,
}));

describe("ApiKeysSettingsPageClient buyer-polished shell (ADP)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    usePathnameMock.mockReturnValue("/");
  });

  it("renders skip link, first-viewport band, orientation above summary, buyer subtitle, and hides vocabulary rails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          enabled: true,
          developmentBypassAll: false,
          admin: { isConfigured: false, maskedSegments: [] },
          readOnly: { isConfigured: false, maskedSegments: [] },
        }),
      }),
    );

    render(<ApiKeysSettingsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("api-keys-settings-page")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: API_KEYS_SETTINGS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${API_KEYS_SETTINGS_SKIP_TARGET_ID}`,
    );
    expect(screen.queryByTestId("api-keys-settings-page-breadcrumb")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByText(API_KEYS_SETTINGS_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(API_KEYS_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByText(API_KEYS_ENTERPRISE_ONLY_NOTICE)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: API_KEYS_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByTestId("api-keys-users-vocabulary-rail")).not.toBeInTheDocument();
    expect(screen.queryByTestId("webhooks-api-keys-vocabulary-rail")).not.toBeInTheDocument();
    expect(screen.queryByTestId("developer-api-contracts-api-keys-vocabulary-rail")).not.toBeInTheDocument();

    const primaryContent = screen.getByTestId(API_KEYS_SETTINGS_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(API_KEYS_SETTINGS_FIRST_VIEWPORT_TEST_ID);
    const orientationTop = screen.getByTestId("api-keys-settings-orientation-top");
    const summaryRow = screen.getByTestId("api-keys-summary-row");
    const sourcesSection = screen.getByTestId("api-keys-settings-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(summaryRow);
    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(summaryRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const source of filterWhereToGoNextFollowUpLinks(API_KEYS_SETTINGS_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
