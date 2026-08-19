import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/ThemePreferenceSelector", () => ({
  ThemePreferenceSelector: () => <div data-testid="theme-preference-selector-stub" />,
}));

import PreferencesSettingsPage from "./page";

describe("PreferencesSettingsPage", () => {
  it("renders appearance theme section with account-backed copy", async () => {
    const page = await PreferencesSettingsPage();

    render(page);

    expect(screen.getByTestId("preferences-settings-page-title")).toHaveTextContent("Preferences");
    expectClaimDisciplineBand(screen, "preferences-settings-claim-discipline".slice(0, -"-claim-discipline".length), "preferences-settings-claim-discipline");
    expect(screen.getByTestId("preferences-appearance-card")).toBeInTheDocument();
    expect(screen.getByText(/saved to your account and applied across supported devices/i)).toBeInTheDocument();
    expect(screen.getByTestId("theme-preference-selector-stub")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "← Settings" })).not.toBeInTheDocument();
  });
});
