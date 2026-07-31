import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/digests",
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
  listDigestSubscriptions: vi.fn(),
  getExecDigestPreferences: vi.fn(),
  saveExecDigestPreferences: vi.fn(),
}));

import { DigestsHubClient } from "@/components/digests/DigestsHubClient";
import { fetchWeeklyDigestHealth, getExecDigestPreferences, listArchitectureDigests } from "@/lib/api";

describe("DigestsHubClient", () => {
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
      setupGaps: [
        "No enabled advisory scan schedule — weekly architecture digests will not be generated on a cadence.",
      ],
    });
  });

  it("renders browse header, health banner, and actionable gaps", async () => {
    render(<DigestsHubClient />);

    expect(await screen.findByTestId("digests-page-title")).toHaveTextContent("Architecture digests");
    expect(
      screen.getByText(
        "Send scheduled summaries of review activity, governance signals, findings, and advisory scans.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("digests-hub-tablist")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Browse" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("digests-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("digests-refresh-button")).toBeEnabled();
    expect(screen.getByTestId("digests-last-updated")).toHaveTextContent(/Last updated:/i);
    expect(screen.getByTestId("digests-privacy-note")).toBeInTheDocument();
    expect(screen.getByTestId("digests-primary-action")).toHaveTextContent("Configure schedule");
    expect(screen.getByTestId("digests-preview-action")).toBeDisabled();
    expect(screen.getByRole("link", { name: "Send test digest" })).toHaveAttribute(
      "href",
      "/governance/advisory-scans?tab=schedules",
    );

    await waitFor(() => {
      expect(screen.getByTestId("digest-setup-gaps")).toBeInTheDocument();
    });
  });

  it("selects the schedule tab from the query parameter and simplifies the header", async () => {
    searchParams = new URLSearchParams("tab=schedule");
    vi.mocked(fetchWeeklyDigestHealth).mockResolvedValue({
      enabledAdvisoryScheduleCount: 1,
      digestSubscriptionCount: 1,
      enabledDigestSubscriptionCount: 1,
      digestSubscriptionsByEmailChannel: 1,
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

    render(<DigestsHubClient />);

    expect(await screen.findByTestId("digests-page-title")).toHaveTextContent("Architecture digests");
    expect(
      screen.getByText(
        "Configure the weekly executive digest for direct recipients. Architecture digests for subscription destinations are managed separately.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Schedule" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("digests-refresh-button")).toBeInTheDocument();
    expect(screen.queryByTestId("digests-primary-action")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digests-preview-action")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digests-send-test-action")).not.toBeInTheDocument();
    expect(screen.queryByTestId("weekly-digest-health-banner")).not.toBeInTheDocument();
    expect(await screen.findByTestId("exec-digest-schedule-content")).toBeInTheDocument();
  });
});
