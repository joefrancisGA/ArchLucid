import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PREFERENCES_WHERE_TO_GO_NEXT_HEADING } from "@/lib/where-to-go-next-preference-copy";
import { PREFERENCES_SAMPLE_REVIEWS_ON_OVERVIEW_HEADING } from "@/lib/sample-reviews-on-overview-preference-copy";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/ThemePreferenceSelector", () => ({
  ThemePreferenceSelector: () => <div data-testid="theme-preference-selector-stub" />,
}));

vi.mock("@/lib/use-cloud-platform-scope", () => ({
  useCloudPlatformScope: () => ({
    scope: { "evidence-only": true, azure: true, aws: true, gcp: true },
    mounted: true,
    accountSyncState: "idle",
    setAndPersist: vi.fn(),
  }),
}));

vi.mock("@/lib/use-iana-time-zone-preference", () => ({
  useIanaTimeZonePreference: () => ({
    ianaTimeZoneId: "UTC",
    mounted: true,
    accountSyncState: "idle",
    setAndPersist: vi.fn(),
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

vi.mock("@/components/SampleReviewsOnOverviewPreferenceProvider", () => ({
  useSampleReviewsOnOverviewPreference: () => ({
    enabled: true,
    mounted: true,
    accountSyncState: "idle",
    setAndPersist: vi.fn(),
  }),
  useSampleReviewsOnOverviewVisible: () => true,
}));

import PreferencesSettingsPage from "./page";

describe("PreferencesSettingsPage", () => {
  it("renders appearance theme section with account-backed copy", async () => {
    const page = await PreferencesSettingsPage();

    render(page);

    expect(screen.getByTestId("preferences-settings-page-title")).toHaveTextContent("Preferences");
    expect(screen.getByTestId("preferences-appearance-card")).toBeInTheDocument();
    expect(screen.getByTestId("preferences-appearance-card")).toHaveTextContent(
      /syncs across browsers where you sign in/i,
    );
    expect(screen.getByTestId("theme-preference-selector-stub")).toBeInTheDocument();
    expect(
      screen.queryByTestId("shell-theme-preferences-appearance-vocabulary"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("preferences-notifications-vocabulary")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Appearance" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Time zone" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cloud platforms shown" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: PREFERENCES_WHERE_TO_GO_NEXT_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: PREFERENCES_SAMPLE_REVIEWS_ON_OVERVIEW_HEADING })).toBeInTheDocument();
    expect(screen.getByTestId("preferences-sample-reviews-on-overview-card")).toBeInTheDocument();
    expect(screen.getByTestId("preferences-follow-up-link-strips-card")).toHaveAttribute("id", "follow-up-link-strips");
    expect(screen.queryByRole("link", { name: "← Settings" })).not.toBeInTheDocument();
  });
});
