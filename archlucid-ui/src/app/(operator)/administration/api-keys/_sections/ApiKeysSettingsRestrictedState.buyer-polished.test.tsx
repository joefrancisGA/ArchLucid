import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration/api-keys",
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

import { ApiKeysSettingsRestrictedState } from "./ApiKeysSettingsRestrictedState";
import {
  API_KEYS_SETTINGS_PRIMARY_CONTENT_ID,
  API_KEYS_SETTINGS_SKIP_LINK_LABEL,
} from "./api-keys-settings-page-copy";

describe("ApiKeysSettingsRestrictedState buyer-polished shell (ADP)", () => {
  it("renders skip link, breadcrumb, and orientation strip on restricted surfaces", () => {
    render(<ApiKeysSettingsRestrictedState reason="surface_disabled" />);

    expect(screen.getByRole("link", { name: API_KEYS_SETTINGS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${API_KEYS_SETTINGS_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("api-keys-settings-page-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("api-keys-settings-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("api-keys-settings-sources")).toBeInTheDocument();
  });
});
