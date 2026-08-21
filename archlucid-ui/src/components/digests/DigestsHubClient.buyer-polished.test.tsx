import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
import { fetchWeeklyDigestHealth, getExecDigestPreferences, listArchitectureDigests } from "@/lib/api";
import { DIGESTS_BROWSE_PAGE_SUBTITLE_BUYER, DIGESTS_PAGE_SUBTITLE_BUYER } from "@/lib/digests-browse-copy";

describe("DigestsHubClient buyer-polished shell", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
    vi.mocked(fetchWeeklyDigestHealth).mockReset();
    vi.mocked(listArchitectureDigests).mockReset();
    vi.mocked(getExecDigestPreferences).mockReset();
    vi.mocked(listArchitectureDigests).mockResolvedValue([]);
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

  it("uses buyer subtitle and collapses the privacy note", async () => {
    render(<DigestsHubClient />);

    expect(await screen.findByText(DIGESTS_BROWSE_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Send scheduled summaries of review activity, governance signals, findings, and advisory scans.",
      ),
    ).not.toBeInTheDocument();
    // Setup-incomplete browse collapses the privacy note behind the get-started checklist.
    expect(screen.queryByTestId("digests-privacy-note")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("digests-header-actions")).toBeInTheDocument();
    });
  });

  it("renders schedule-tab buyer chrome with orientation and hidden vocabulary rail", async () => {
    searchParams = new URLSearchParams("tab=schedule");

    render(<DigestsHubClient />);

    expect(await screen.findByText(DIGESTS_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId("digests-schedule-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("digests-schedule-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("digests-advisory-scans-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digests-last-updated")).not.toBeInTheDocument();

    const orderedLandmarks = ["exec-digest-schedule-content", "digests-schedule-orientation-top"]
      .map((testId) => document.querySelector(`[data-testid="${testId}"]`))
      .filter((node): node is HTMLElement => node !== null)
      .map((node) => node.getAttribute("data-testid"));

    expect(orderedLandmarks).toEqual(["exec-digest-schedule-content", "digests-schedule-orientation-top"]);
  });
});
