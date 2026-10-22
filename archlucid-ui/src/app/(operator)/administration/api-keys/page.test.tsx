import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    redirect,
  };
});

const apiKeysSurface = vi.hoisted(() => ({
  enabled: true,
}));

vi.mock("@/lib/api-keys-settings-access", () => ({
  isApiKeysSettingsSurfaceEnabled: () => apiKeysSurface.enabled,
}));

vi.mock("./_sections/ApiKeysSettingsPageClient", () => ({
  ApiKeysSettingsPageClient: () => <div data-testid="api-keys-settings-page-stub" />,
}));

import ApiKeysSettingsPage from "./page";

describe("ApiKeysSettingsPage", () => {
  beforeEach(() => {
    apiKeysSurface.enabled = true;
    redirect.mockReset();
  });

  it("renders API keys settings when the surface is enabled", async () => {
    const page = await ApiKeysSettingsPage();

    render(page);

    expect(screen.getByTestId("api-keys-settings-page-stub")).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects to Users and roles when the surface is disabled", async () => {
    apiKeysSurface.enabled = false;

    await ApiKeysSettingsPage();

    expect(redirect).toHaveBeenCalledWith("/administration/users");
  });
});
