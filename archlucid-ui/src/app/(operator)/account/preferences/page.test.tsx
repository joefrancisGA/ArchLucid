import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PREFERENCES_WHERE_TO_GO_NEXT_HEADING } from "@/lib/where-to-go-next-preference-copy";
import { preferencesAppearanceThemeLead } from "@/lib/preferences-page-copy";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/ThemePreferenceSelector", () => ({
  ThemePreferenceSelector: () => <div data-testid="theme-preference-selector-stub" />,
}));

vi.mock("@/lib/use-user-appearance-preference", () => ({
  useUserAppearancePreference: () => ({
    preference: "system",
    systemPrefersDark: false,
    mounted: true,
    accountSyncState: "idle",
    setAndPersist: vi.fn(),
  }),
}));

vi.mock("@/lib/use-iana-time-zone-preference", () => ({
  useIanaTimeZonePreference: () => ({
    ianaTimeZoneId: "America/New_York",
    mounted: true,
    accountSyncState: "idle",
    setAndPersist: vi.fn(),
  }),
}));

vi.mock("@/lib/use-user-preferences-explicit-flags", () => ({
  useUserPreferencesExplicitFlags: () => ({
    appearanceIsExplicit: false,
    cloudPlatformScopeIsExplicit: false,
    ianaTimeZoneIsExplicit: false,
    whereToGoNextIsExplicit: false,
    sampleReviewsOnOverviewIsExplicit: false,
    workspaceModeIsExplicit: false,
    loaded: true,
  }),
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextPreference: () => ({
    enabled: true,
    mounted: true,
    accountSyncState: "idle",
    setAndPersist: vi.fn(),
  }),
  useWhereToGoNextVisible: () => true,
}));

import PreferencesSettingsPage from "./page";

describe("PreferencesSettingsPage", () => {
  it("renders appearance theme section with account-backed copy", async () => {
    const page = await PreferencesSettingsPage();
    const productLineId = resolveProductLineIdFromEnv();

    render(page);

    expect(screen.getByTestId("preferences-settings-page-title")).toHaveTextContent("Preferences");
    expect(screen.getByTestId("preferences-appearance-card")).toBeInTheDocument();
    expect(screen.getByTestId("preferences-appearance-card")).toHaveTextContent(
      preferencesAppearanceThemeLead(productLineId),
    );
    expect(screen.getByTestId("theme-preference-selector-stub")).toBeInTheDocument();
    expect(
      screen.queryByTestId("shell-theme-preferences-appearance-vocabulary"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("preferences-notifications-vocabulary")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Appearance" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Time zone" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: PREFERENCES_WHERE_TO_GO_NEXT_HEADING })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Cloud platforms shown" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sample reviews on Home" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Workspace mode" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("preferences-cloud-platforms-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("preferences-sample-reviews-on-overview-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("preferences-workspace-mode-card")).not.toBeInTheDocument();
    expect(screen.getByTestId("preferences-follow-up-link-strips-card")).toHaveAttribute("id", "follow-up-link-strips");
    expect(screen.queryByRole("link", { name: "← Settings" })).not.toBeInTheDocument();
  });
});
