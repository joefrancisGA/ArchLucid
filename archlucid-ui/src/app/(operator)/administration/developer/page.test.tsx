import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    redirect,
    usePathname: () => "/",
  };
});

const internalShell = vi.hoisted(() => ({
  enabled: true,
}));

vi.mock("@/lib/features", () => ({
  isShowSystemAdministrationNavEnabled: () => internalShell.enabled,
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("./DeveloperSettingsPageClient", () => ({
  DeveloperSettingsPageClient: () => <div data-testid="developer-settings-page-stub" />,
}));

import DeveloperSettingsPage from "./page";

describe("DeveloperSettingsPage", () => {
  beforeEach(() => {
    internalShell.enabled = true;
    redirect.mockReset();
  });

  it("renders internal developer tools in the internal operator shell", async () => {
    const page = await DeveloperSettingsPage();

    render(page);

    expect(screen.getByTestId("developer-settings-page-stub")).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects customer shells to preferences", async () => {
    internalShell.enabled = false;

    await DeveloperSettingsPage();

    expect(redirect).toHaveBeenCalledWith("/account/preferences");
  });
});
