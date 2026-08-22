import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let searchParams = new URLSearchParams();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
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
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

vi.mock("@/lib/api", () => ({
  fetchWeeklyDigestHealth: vi.fn(),
  listArchitectureDigests: vi.fn(),
  getArchitectureDigest: vi.fn(),
  listDigestDeliveryAttempts: vi.fn(),
  listDigestDeliveryAttemptsBatch: vi.fn(async () => []),
  listDigestSubscriptions: vi.fn(),
  listSubscriptionDeliveryAttempts: vi.fn(),
  createDigestSubscription: vi.fn(),
  toggleDigestSubscription: vi.fn(),
  fetchTenantIntegrationsOperations: vi.fn(),
  getExecDigestPreferences: vi.fn(),
  saveExecDigestPreferences: vi.fn(),
}));

import { DigestsHubClient } from "@/components/digests/DigestsHubClient";
import {
  fetchWeeklyDigestHealth,
  getExecDigestPreferences,
  listArchitectureDigests,
  listDigestSubscriptions,
  listSubscriptionDeliveryAttempts,
} from "@/lib/api";

const configuredHealth = {
  enabledAdvisoryScheduleCount: 1,
  digestSubscriptionCount: 1,
  enabledDigestSubscriptionCount: 1,
  digestSubscriptionsByEmailChannel: 1,
  digestSubscriptionsBySlackChannel: 0,
  digestSubscriptionsByTeamsChannel: 0,
  executiveEmailDigestIsConfigured: true,
  executiveEmailDigestEnabled: true,
  executiveDigestRecipientCount: 2,
  executiveDigestIanaTimeZoneId: "UTC",
  executiveDigestDayOfWeek: 1,
  executiveDigestHourOfDay: 8,
  setupGaps: [],
};

describe("DigestsHubClient", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
    push.mockReset();
    vi.mocked(fetchWeeklyDigestHealth).mockReset();
    vi.mocked(listArchitectureDigests).mockReset();
    vi.mocked(getExecDigestPreferences).mockReset();
    vi.mocked(listArchitectureDigests).mockResolvedValue([]);
    vi.mocked(listDigestSubscriptions).mockResolvedValue([]);
    vi.mocked(listSubscriptionDeliveryAttempts).mockResolvedValue([]);
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
      setupGaps: [
        "No enabled advisory scan schedule — weekly architecture digests will not be generated on a cadence.",
      ],
    });
  });

  it("renders browse header, tabs, and a status strip", async () => {
    render(<DigestsHubClient />);

    expect(await screen.findByTestId("digests-page-title")).toHaveTextContent("Architecture digests");
    expect(
      screen.getByText(
        "Send scheduled summaries of review activity, approval signals, findings, and advisory scans.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("digests-hub-tablist")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Get started" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("digests-refresh-button")).toBeEnabled();
    expect(screen.queryByTestId("digests-privacy-note")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("weekly-digest-health-banner")).toBeInTheDocument();
    });
  });

  it("orients Get started with one related-surfaces line instead of four vocabulary rails", async () => {
    render(<DigestsHubClient />);

    expect(await screen.findByTestId("digests-related-surfaces")).toBeInTheDocument();
    expect(screen.getByTestId("digests-related-surfaces-peer-notifications")).toBeInTheDocument();
    expect(screen.getByTestId("digests-related-surfaces-peer-teams")).toBeInTheDocument();
    expect(screen.getByTestId("digests-related-surfaces-peer-slack")).toBeInTheDocument();
    expect(screen.getByTestId("digests-related-surfaces-peer-advisory-scans")).toBeInTheDocument();

    expect(screen.queryByTestId("digests-notifications-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digests-teams-slack-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digests-advisory-scans-vocabulary")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("digests-browse-schedule-subscriptions-vocabulary"),
    ).not.toBeInTheDocument();
  });

  it("renders the tab list under the header without Sources follow-up chrome (TB-2092)", async () => {
    render(<DigestsHubClient />);

    expect(await screen.findByTestId("digests-hub-tablist")).toBeInTheDocument();
    expect(screen.queryByTestId("digests-orientation")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Sources for follow-up" })).toBeNull();
  });

  it("lets the Browse checklist own setup actions during initial setup", async () => {
    render(<DigestsHubClient />);

    await waitFor(() => {
      expect(screen.getByTestId("weekly-digest-health-banner")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("digests-primary-action")).not.toBeInTheDocument();
    expect(screen.getByTestId("digests-browse-checklist-action-schedule")).toBeInTheDocument();
  });

  it("shows setup guidance on Subscriptions without duplicating a Browse header primary", async () => {
    searchParams = new URLSearchParams("tab=subscriptions");

    render(<DigestsHubClient />);

    await waitFor(() => {
      expect(screen.getByTestId("weekly-digest-health-banner")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("digests-primary-action")).not.toBeInTheDocument();
    expect(await screen.findByTestId("digest-subscriptions-readiness-panel")).toBeInTheDocument();
    expect(screen.getByTestId("digests-browse-schedule-subscriptions-vocabulary")).toBeInTheDocument();
    expect(screen.queryByTestId("digests-notifications-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digests-teams-slack-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digests-advisory-scans-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digests-related-surfaces")).not.toBeInTheDocument();
    expect(screen.queryByTestId("explain-this-view-banner")).not.toBeInTheDocument();
  });

  it("lets the Browse checklist own setup guidance so the banner does not repeat it", async () => {
    render(<DigestsHubClient />);

    await waitFor(() => {
      expect(screen.getByTestId("weekly-digest-health-banner")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("digest-setup-gaps")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digests-browse-next-best-action")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digests-browse-setup-message")).not.toBeInTheDocument();
    expect(screen.getByTestId("digest-status-compact-facts")).toBeInTheDocument();
    expect(screen.queryByTestId("explain-this-view-banner")).not.toBeInTheDocument();
    expect(await screen.findByTestId("digests-browse-setup-checklist")).toBeInTheDocument();
  });

  it("promotes Preview latest to primary once the loop is fully configured", async () => {
    vi.mocked(fetchWeeklyDigestHealth).mockResolvedValue({
      ...configuredHealth,
      latestArchitectureDigestId: "d1",
      latestArchitectureDigestGeneratedUtc: "2026-07-08T12:00:00Z",
    });

    render(<DigestsHubClient />);

    const preview = await screen.findByTestId("digests-preview-action");

    expect(preview).toHaveAttribute("href", "/architecture/digests?tab=get-started#digest-d1");
    expect(screen.queryByTestId("digests-primary-action")).not.toBeInTheDocument();
  });

  it("keeps ?tab=get-started in the URL when Get started is selected (TB-1505)", async () => {
    searchParams = new URLSearchParams("tab=subscriptions");

    render(<DigestsHubClient />);

    fireEvent.click(await screen.findByTestId("digests-hub-tab-get-started"));

    expect(push).toHaveBeenCalledWith("/architecture/digests?tab=get-started");
  });

  it("selects the schedule tab from the query parameter and simplifies the header", async () => {
    searchParams = new URLSearchParams("tab=schedule");
    vi.mocked(fetchWeeklyDigestHealth).mockResolvedValue({
      ...configuredHealth,
      executiveEmailDigestIsConfigured: false,
      executiveEmailDigestEnabled: false,
      executiveDigestRecipientCount: 0,
    });

    render(<DigestsHubClient />);

    expect(await screen.findByTestId("digests-page-title")).toHaveTextContent("Architecture digests");
    expect(
      screen.getByText(
        "Configure the weekly sponsor digest for direct recipients. Architecture digests for subscription destinations are managed separately.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Sponsor schedule" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("digests-refresh-button")).toBeInTheDocument();
    expect(screen.queryByTestId("digests-primary-action")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digests-preview-action")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digests-send-test-action")).not.toBeInTheDocument();
    expect(screen.queryByTestId("weekly-digest-health-banner")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digests-schedule-orientation")).toBeNull(); // TB-2092
    expect(screen.queryByTestId("digests-orientation")).not.toBeInTheDocument();
    expect(await screen.findByTestId("exec-digest-schedule-content")).toBeInTheDocument();
    expect(screen.getByTestId("digests-advisory-scans-vocabulary")).toBeInTheDocument();
    expect(screen.queryByTestId("digests-notifications-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digests-teams-slack-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digests-browse-schedule-subscriptions-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digests-related-surfaces")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digest-recurrence-schedule-vocabulary")).not.toBeInTheDocument();
  });
});
