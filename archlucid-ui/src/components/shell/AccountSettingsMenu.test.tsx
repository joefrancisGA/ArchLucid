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
import { OPERATOR_SHELL_GET_SUPPORT_MENU_ITEM } from "@/lib/operator/operator-shell-support-affordances";

import {
  AccountSettingsMenu,
  computeAccountSettingsMenuPanelStyle,
} from "./AccountSettingsMenu";

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
    expect(screen.getByTestId(`account-settings-menu-item-${OPERATOR_SHELL_GET_SUPPORT_MENU_ITEM.id}`)).toHaveAttribute(
      "href",
      OPERATOR_SHELL_GET_SUPPORT_MENU_ITEM.href,
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

  it("portals the menu to document.body so sticky top-bar overflow cannot trap a scrollbar", () => {
    const { container } = render(<AccountSettingsMenu />);

    openMenu();

    const menu = screen.getByTestId("account-settings-menu");

    expect(menu.parentElement).toBe(document.body);
    expect(container.contains(menu)).toBe(false);
    expect(menu.style.position).toBe("fixed");
  });

  it("closes on Escape", () => {
    render(<AccountSettingsMenu />);

    openMenu();
    expect(screen.getByTestId("account-settings-menu")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByTestId("account-settings-menu")).not.toBeInTheDocument();
  });
});

describe("computeAccountSettingsMenuPanelStyle", () => {
  it("anchors the panel under the trigger's right edge", () => {
    const trigger = document.createElement("button");

    trigger.getBoundingClientRect = () =>
      ({
        top: 10,
        bottom: 40,
        left: 900,
        right: 940,
        width: 40,
        height: 30,
        x: 900,
        y: 10,
        toJSON: () => ({}),
      }) as DOMRect;

    const style = computeAccountSettingsMenuPanelStyle(trigger);

    expect(style.position).toBe("fixed");
    expect(style.top).toBe(44);
    expect(style.left).toBe(940 - Math.min(288, window.innerWidth - 32));
  });
});
