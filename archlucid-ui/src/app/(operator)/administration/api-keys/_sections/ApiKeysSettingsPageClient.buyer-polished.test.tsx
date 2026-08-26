import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const usePathnameMock = vi.hoisted(() => vi.fn(() => "/"));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    usePathname: () => usePathnameMock(),
  };
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

import { ApiKeysSettingsPageClient } from "./ApiKeysSettingsPageClient";
import {
  API_KEYS_PAGE_SUBTITLE,
  API_KEYS_ENTERPRISE_ONLY_NOTICE,
} from "@/lib/api-keys-settings-copy";
import {
  API_KEYS_SETTINGS_PAGE_SUBTITLE_BUYER,
  API_KEYS_SETTINGS_PRIMARY_CONTENT_ID,
  API_KEYS_SETTINGS_SKIP_LINK_LABEL,
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

  it("renders skip link, breadcrumb, orientation above summary, buyer subtitle, and hides vocabulary rails", async () => {
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
      `#${API_KEYS_SETTINGS_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.queryByTestId("api-keys-settings-page-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByText(API_KEYS_SETTINGS_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(API_KEYS_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByText(API_KEYS_ENTERPRISE_ONLY_NOTICE)).not.toBeInTheDocument();
    expect(screen.getByTestId("api-keys-settings-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("api-keys-settings-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("api-keys-users-vocabulary-rail")).not.toBeInTheDocument();
    expect(screen.queryByTestId("webhooks-api-keys-vocabulary-rail")).not.toBeInTheDocument();
    expect(screen.queryByTestId("developer-api-contracts-api-keys-vocabulary-rail")).not.toBeInTheDocument();

    const primaryContent = screen.getByTestId("api-keys-settings-primary-content");
    const orderedLandmarks = ["api-keys-settings-orientation-top", "api-keys-summary-row"]
      .map((testId) => primaryContent.querySelector(`[data-testid="${testId}"]`))
      .filter((node): node is HTMLElement => node !== null)
      .map((node) => node.getAttribute("data-testid"));

    expect(orderedLandmarks).toEqual(["api-keys-settings-orientation-top", "api-keys-summary-row"]);
  });
});
