import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routing = vi.hoisted(() => ({
  pathname: "/",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => routing.pathname,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import {
  SETTINGS_ACCOUNT_SECURITY_PATH,
  SETTINGS_PREFERENCES_PATH,
} from "@/lib/settings-admin-route-paths";

import { AccountSettingsMenu } from "./AccountSettingsMenu";

function openMenu(): void {
  fireEvent.click(screen.getByTestId("account-settings-menu-trigger"));
}

describe("AccountSettingsMenu", () => {
  beforeEach(() => {
    routing.pathname = "/";
  });

  it("exposes user-scoped settings without consulting authority rank", () => {
    render(<AccountSettingsMenu />);

    openMenu();

    expect(screen.getByTestId("account-settings-menu-item-user-preferences")).toHaveAttribute(
      "href",
      SETTINGS_PREFERENCES_PATH,
    );
    expect(screen.getByTestId("account-settings-menu-item-account-security")).toHaveAttribute(
      "href",
      SETTINGS_ACCOUNT_SECURITY_PATH,
    );
  });

  it("marks the destination matching the current route as the current page", () => {
    routing.pathname = SETTINGS_PREFERENCES_PATH;

    render(<AccountSettingsMenu />);

    openMenu();

    expect(screen.getByTestId("account-settings-menu-item-user-preferences")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByTestId("account-settings-menu-item-account-security")).not.toHaveAttribute(
      "aria-current",
    );
  });
});
