import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

let searchParams = new URLSearchParams("tab=schedule");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/architecture/digests",
  useSearchParams: () => searchParams,
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/lib/api", () => ({
  fetchWeeklyDigestHealth: vi.fn(),
  listArchitectureDigests: vi.fn(),
  getArchitectureDigest: vi.fn(),
  listDigestDeliveryAttempts: vi.fn(),
  listDigestDeliveryAttemptsBatch: vi.fn(async () => []),
  listDigestSubscriptions: vi.fn(),
  getExecDigestPreferences: vi.fn(),
  saveExecDigestPreferences: vi.fn(),
}));

import { DigestsHubClient } from "@/components/digests/DigestsHubClient";
import { fetchWeeklyDigestHealth, getExecDigestPreferences } from "@/lib/api";
import {
  DIGESTS_HUB_FIRST_VIEWPORT_TEST_ID,
  DIGESTS_HUB_PRIMARY_CONTENT_ID,
  DIGESTS_HUB_SKIP_LINK_LABEL,
  DIGESTS_HUB_SKIP_TARGET_ID,
  DIGESTS_PAGE_SUBTITLE_BUYER,
} from "@/lib/digests-browse-copy";
import { DIGESTS_SCHEDULE_ORIENTATION_SOURCES } from "@/lib/digests-schedule-evidence-copy";
import {
  DIGESTS_SCHEDULE_TRAFFIC_PATH,
  DIGESTS_SCHEDULE_TRAFFIC_ROW_ID,
} from "@/lib/ui-route-traffic-digests-schedule";

describe("DigestsHubClient buyer-polished schedule tab (ARS)", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams("tab=schedule");
    vi.mocked(fetchWeeklyDigestHealth).mockReset();
    vi.mocked(getExecDigestPreferences).mockReset();
    vi.mocked(getExecDigestPreferences).mockResolvedValue({
      schemaVersion: 1,
      tenantId: "t",
      isConfigured: false,
      emailEnabled: false,
      recipientEmails: [],
      ianaTimeZoneId: "UTC",
      dayOfWeek: 1,
      hourOfDay: 8,
      updatedUtc: "2026-07-08T12:00:00Z",
    });
    vi.mocked(fetchWeeklyDigestHealth).mockResolvedValue({
      enabledAdvisoryScheduleCount: 0,
      digestSubscriptionCount: 0,
      enabledDigestSubscriptionCount: 0,
      digestSubscriptionsByEmailChannel: 0,
      digestSubscriptionsBySlackChannel: 0,
      digestSubscriptionsByTeamsChannel: 0,
      executiveEmailDigestIsConfigured: false,
      executiveEmailDigestEnabled: false,
      executiveDigestRecipientCount: 0,
      executiveDigestIanaTimeZoneId: "UTC",
      executiveDigestDayOfWeek: 1,
      executiveDigestHourOfDay: 8,
      setupGaps: [],
    });
  });

  it("renders ARS deep link with skip link, first-viewport band, orientation above schedule workspace, and Sources links", async () => {
    expect(DIGESTS_SCHEDULE_TRAFFIC_ROW_ID).toBe("ARS");
    expect(DIGESTS_SCHEDULE_TRAFFIC_PATH).toBe("/architecture/digests?tab=schedule");

    render(<DigestsHubClient />);

    expect(screen.getByRole("link", { name: DIGESTS_HUB_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${DIGESTS_HUB_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("digests-hub-primary-content")).toHaveAttribute(
      "id",
      DIGESTS_HUB_PRIMARY_CONTENT_ID,
    );

    expect(await screen.findByText(DIGESTS_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId("digests-hub-tab-schedule")).toHaveAttribute("data-state", "active");
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digests-advisory-scans-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digests-last-updated")).not.toBeInTheDocument();

    const primaryContent = screen.getByTestId("digests-hub-primary-content");
    const firstViewport = screen.getByTestId(DIGESTS_HUB_FIRST_VIEWPORT_TEST_ID);
    const orientationTop = screen.getByTestId("digests-schedule-orientation-top");
    const scheduleContent = screen.getByTestId("exec-digest-schedule-content");
    const sourcesSection = screen.getByTestId("digests-schedule-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(scheduleContent);
    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(scheduleContent) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const source of filterWhereToGoNextFollowUpLinks(DIGESTS_SCHEDULE_ORIENTATION_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    await waitFor(() => {
      expect(screen.getByTestId("digests-header-actions")).toBeInTheDocument();
    });
  });
});
