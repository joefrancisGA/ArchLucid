import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    usePathname: () => "/administration/api-keys",
  });
});

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { ApiKeysSettingsRestrictedState } from "./ApiKeysSettingsRestrictedState";
import {
  API_KEYS_SETTINGS_FIRST_VIEWPORT_TEST_ID,
  API_KEYS_SETTINGS_PRIMARY_CONTENT_ID,
  API_KEYS_SETTINGS_SKIP_LINK_LABEL,
  API_KEYS_SETTINGS_SKIP_TARGET_ID,
} from "./api-keys-settings-page-copy";

describe("ApiKeysSettingsRestrictedState buyer-polished shell (ADP)", () => {
  it("renders skip link, breadcrumb, and orientation strip on restricted surfaces", () => {
    render(<ApiKeysSettingsRestrictedState reason="surface_disabled" />);

    expect(screen.getByRole("link", { name: API_KEYS_SETTINGS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${API_KEYS_SETTINGS_SKIP_TARGET_ID}`,
    );
    expect(screen.queryByTestId("api-keys-settings-page-breadcrumb")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();

    const primaryContent = screen.getByTestId(API_KEYS_SETTINGS_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(API_KEYS_SETTINGS_FIRST_VIEWPORT_TEST_ID);

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(screen.getByTestId("api-keys-settings-orientation-top"));
    expect(firstViewport).toContainElement(screen.getByTestId("api-keys-settings-sources"));
  });
});
