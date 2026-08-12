import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const usePathnameMock = vi.hoisted(() => vi.fn(() => "/administration/api-keys"));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    usePathname: () => usePathnameMock(),
  };
});

import { ApiKeysSettingsRestrictedState } from "./ApiKeysSettingsRestrictedState";
import {
  API_KEYS_RESTRICTED_TITLE,
  API_KEYS_SURFACE_DISABLED_DESCRIPTION,
  API_KEYS_SURFACE_DISABLED_TITLE,
} from "@/lib/api-keys-settings-copy";
import { contextualHelpForPathname } from "@/lib/contextual-help-registry";
import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";

describe("ApiKeysSettingsRestrictedState", () => {
  it("renders parked-surface copy, breadcrumb, links, and compact empty state (P0-1, P0-2)", () => {
    render(<ApiKeysSettingsRestrictedState reason="surface_disabled" />);

    expect(screen.getByTestId("api-keys-settings-restricted-title")).toHaveTextContent(
      API_KEYS_SURFACE_DISABLED_TITLE,
    );
    expect(screen.queryByText(/restricted/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Internal Operations/i)).not.toBeInTheDocument();

    const breadcrumb = screen.getByTestId("api-keys-settings-page-breadcrumb");
    expect(breadcrumb).toHaveTextContent("Administration");
    expect(breadcrumb).toHaveTextContent("API keys");
    expect(screen.getByRole("link", { name: "Administration" })).toHaveAttribute(
      "href",
      SETTINGS_ROOT_PATH,
    );

    expect(screen.getByTestId("api-keys-surface-disabled-empty-state")).toBeInTheDocument();
    expect(screen.getByText(API_KEYS_SURFACE_DISABLED_DESCRIPTION)).toBeInTheDocument();

    const usersLink = screen.getByRole("link", { name: "Users and roles" });
    expect(usersLink).toHaveAttribute("href", "/administration/users");

    const settingsLink = screen.getByRole("link", { name: "Settings" });
    expect(settingsLink).toHaveAttribute("href", SETTINGS_ROOT_PATH);
  });

  it("renders forbidden title and permission empty state", () => {
    render(<ApiKeysSettingsRestrictedState reason="forbidden" />);

    expect(screen.getByTestId("api-keys-settings-restricted-title")).toHaveTextContent(
      API_KEYS_RESTRICTED_TITLE,
    );
    expect(screen.getByTestId("api-keys-forbidden-empty-state")).toBeInTheDocument();
    expect(screen.getByText("You need access to manage API keys")).toBeInTheDocument();
  });

  it("exposes contextual help with authored whyEmpty guidance (P0-3)", () => {
    usePathnameMock.mockReturnValue("/administration/api-keys");

    render(<ApiKeysSettingsRestrictedState reason="surface_disabled" />);

    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("page-contextual-help-button"));

    const helpEntry = contextualHelpForPathname("/administration/api-keys");
    expect(helpEntry?.whyEmpty).toBeTruthy();
    expect(screen.getByText(helpEntry!.whyEmpty!)).toBeInTheDocument();
    expect(helpEntry?.whereToConfigurePrerequisite).not.toContain("isApiKeysSettingsSurfaceEnabled");
    expect(screen.queryByText(/isApiKeysSettingsSurfaceEnabled/i)).not.toBeInTheDocument();
  });
});
