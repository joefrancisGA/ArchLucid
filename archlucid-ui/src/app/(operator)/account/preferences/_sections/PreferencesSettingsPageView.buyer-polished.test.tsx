import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/ThemePreferenceSelector", () => ({
  ThemePreferenceSelector: () => <div data-testid="theme-preference-selector-stub" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
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

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({
    productLine: "security",
    assignmentOverrides: {},
    setProductLine: vi.fn(),
    setHrefAssignment: vi.fn(),
    resetHrefAssignment: vi.fn(),
    resetAllAssignments: vi.fn(),
  }),
}));

import { PreferencesSettingsPageView } from "./PreferencesSettingsPageView";
import {
  PREFERENCES_SETTINGS_FIRST_VIEWPORT_TEST_ID,
  PREFERENCES_SETTINGS_PAGE_SUBTITLE_BUYER,
  PREFERENCES_SETTINGS_PRIMARY_CONTENT_ID,
  PREFERENCES_SETTINGS_SKIP_LINK_LABEL,
  PREFERENCES_SETTINGS_SKIP_TARGET_ID,
} from "@/lib/preferences-page-copy";
import { ACCOUNT_PREFERENCES_PATH } from "@/lib/account-route-paths";
import { filterOrientationSourcesForJobContext } from "@/lib/evidence-orientation/job-context-orientation-sources-filter";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import {
  PREFERENCES_SETTINGS_FOLLOW_UPS_TITLE,
  preferencesSettingsSources,
} from "@/lib/preferences-settings-evidence-copy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

describe("PreferencesSettingsPageView buyer-polished shell (ADR)", () => {
  it("renders skip link, preference cards before follow-ups, buyer subtitle, and hides contextual help", () => {
    render(<PreferencesSettingsPageView />);

    expect(screen.getByRole("link", { name: PREFERENCES_SETTINGS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${PREFERENCES_SETTINGS_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(PREFERENCES_SETTINGS_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("preferences-settings-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: PREFERENCES_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("preferences-settings-page-title")).toHaveTextContent("Preferences");

    const primaryContent = screen.getByTestId(PREFERENCES_SETTINGS_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(PREFERENCES_SETTINGS_FIRST_VIEWPORT_TEST_ID);
    const appearanceCard = screen.getByTestId("preferences-appearance-card");
    const orientationBottom = screen.getByTestId("preferences-settings-orientation-bottom");
    const sourcesSection = screen.getByTestId("preferences-settings-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport).toContainElement(appearanceCard);
    expect(orientationBottom).toContainElement(sourcesSection);

    for (const source of filterOrientationSourcesForJobContext(
      filterWhereToGoNextFollowUpLinks(preferencesSettingsSources("security")),
      ACCOUNT_PREFERENCES_PATH,
    )) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
