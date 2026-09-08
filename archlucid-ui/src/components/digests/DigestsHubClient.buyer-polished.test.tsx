import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

let searchParams = new URLSearchParams();

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
import { fetchWeeklyDigestHealth, getExecDigestPreferences, listArchitectureDigests, listDigestSubscriptions } from "@/lib/api";
import {
  DIGESTS_BROWSE_ORIENTATION_SOURCES,
} from "@/lib/digests-browse-evidence-copy";
import {
  DIGESTS_BROWSE_PAGE_SUBTITLE_BUYER,
  DIGESTS_HUB_FIRST_VIEWPORT_TEST_ID,
  DIGESTS_HUB_PRIMARY_CONTENT_ID,
  DIGESTS_HUB_SKIP_LINK_LABEL,
  DIGESTS_HUB_SKIP_TARGET_ID,
} from "@/lib/digests-browse-copy";
import {
  DIGESTS_SUBSCRIPTIONS_ORIENTATION_SOURCES,
} from "@/lib/digests-subscriptions-evidence-copy";

describe("DigestsHubClient buyer-polished shell (ARD)", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
    vi.mocked(fetchWeeklyDigestHealth).mockReset();
    vi.mocked(listArchitectureDigests).mockReset();
    vi.mocked(getExecDigestPreferences).mockReset();
    vi.mocked(listDigestSubscriptions).mockReset();
    vi.mocked(listArchitectureDigests).mockResolvedValue([]);
    vi.mocked(listDigestSubscriptions).mockResolvedValue([]);
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

  it("uses buyer subtitle, skip link, first-viewport band, and collapses the privacy note", async () => {
    render(<DigestsHubClient />);

    expect(screen.getByRole("link", { name: DIGESTS_HUB_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${DIGESTS_HUB_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("digests-hub-primary-content")).toHaveAttribute(
      "id",
      DIGESTS_HUB_PRIMARY_CONTENT_ID,
    );

    expect(await screen.findByText(DIGESTS_BROWSE_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Send scheduled summaries of review activity, approval signals, findings, and advisory scans.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("digests-privacy-note")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digests-related-surfaces")).not.toBeInTheDocument();

    const primaryContent = screen.getByTestId("digests-hub-primary-content");
    const firstViewport = screen.getByTestId(DIGESTS_HUB_FIRST_VIEWPORT_TEST_ID);
    const tabList = screen.getByTestId("digests-hub-tablist");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(tabList);

    await waitFor(() => {
      expect(screen.getByTestId("digests-header-actions")).toBeInTheDocument();
    });
  });

  it("renders get-started tab buyer chrome with orientation above browse workspace", async () => {
    searchParams = new URLSearchParams("tab=get-started");

    render(<DigestsHubClient />);

    expect(await screen.findByText(DIGESTS_BROWSE_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId("digests-browse-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("digests-browse-settings-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("digests-related-surfaces")).not.toBeInTheDocument();

    const orientationTop = screen.getByTestId("digests-browse-orientation-top");
    const browseContent = screen.getByTestId("digests-browse-content");
    const sourcesSection = screen.getByTestId("digests-browse-settings-sources");

    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(browseContent) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const source of filterWhereToGoNextFollowUpLinks(DIGESTS_BROWSE_ORIENTATION_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });

  it("renders subscriptions-tab buyer chrome with orientation above subscriptions workspace", async () => {
    searchParams = new URLSearchParams("tab=subscriptions");
    vi.mocked(listDigestSubscriptions).mockResolvedValue([]);

    render(<DigestsHubClient />);

    expect(await screen.findByTestId("digest-subscriptions-content")).toBeInTheDocument();
    expect(screen.getByTestId("digests-subscriptions-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("digests-subscriptions-settings-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("digests-advisory-scans-vocabulary")).not.toBeInTheDocument();

    const orientationTop = screen.getByTestId("digests-subscriptions-orientation-top");
    const subscriptionsContent = screen.getByTestId("digest-subscriptions-content");
    const sourcesSection = screen.getByTestId("digests-subscriptions-settings-sources");

    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(subscriptionsContent) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const source of filterWhereToGoNextFollowUpLinks(DIGESTS_SUBSCRIPTIONS_ORIENTATION_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
