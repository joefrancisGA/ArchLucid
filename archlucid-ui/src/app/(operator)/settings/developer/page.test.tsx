import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const internalShell = vi.hoisted(() => ({
  enabled: true,
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/lib/internal-operator-env", () => ({
  isArchLucidInternalOperatorShellEnv: () => internalShell.enabled,
}));

vi.mock("@/components/settings/AuthorityThemeDevSelector", () => ({
  AuthorityThemeDevSelector: () => <div data-testid="authority-theme-dev-selector-stub" />,
}));

vi.mock("@/components/TryCliDemoCard", () => ({
  TryCliDemoCard: () => <div data-testid="try-cli-demo-card-stub" />,
}));

import DeveloperSettingsPage from "./page";

describe("DeveloperSettingsPage", () => {
  beforeEach(() => {
    internalShell.enabled = true;
  });

  it("renders theme preview and CLI demo in the internal operator shell", () => {
    render(<DeveloperSettingsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Developer tools" })).toBeInTheDocument();
    expect(screen.getByTestId("authority-theme-dev-selector-stub")).toBeInTheDocument();
    expect(screen.getByTestId("try-cli-demo-card-stub")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "← Settings" })).toHaveAttribute("href", "/settings");
  });

  it("blocks developer tools outside the internal operator shell", () => {
    internalShell.enabled = false;

    render(<DeveloperSettingsPage />);

    expect(screen.getByTestId("developer-settings-forbidden")).toBeInTheDocument();
    expect(screen.queryByTestId("try-cli-demo-card-stub")).not.toBeInTheDocument();
    expect(screen.queryByTestId("authority-theme-dev-selector-stub")).not.toBeInTheDocument();
  });
});
