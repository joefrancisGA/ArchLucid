import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/digests",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/api", () => ({
  fetchWeeklyDigestHealth: vi.fn(),
  listArchitectureDigests: vi.fn(),
  getArchitectureDigest: vi.fn(),
  listDigestDeliveryAttempts: vi.fn(),
  listDigestSubscriptions: vi.fn(),
  getExecDigestPreferences: vi.fn(),
}));

import { DigestsHubClient } from "@/components/digests/DigestsHubClient";
import { fetchWeeklyDigestHealth, listArchitectureDigests } from "@/lib/api";

describe("DigestsHubClient", () => {
  beforeEach(() => {
    vi.mocked(fetchWeeklyDigestHealth).mockReset();
    vi.mocked(listArchitectureDigests).mockReset();
    vi.mocked(listArchitectureDigests).mockResolvedValue([]);
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

  it("renders page header, real tabs, refresh, privacy note, and actionable gaps", async () => {
    render(<DigestsHubClient />);

    expect(await screen.findByTestId("digests-page-title")).toHaveTextContent("Architecture digests");
    expect(
      screen.getByText(
        "Send scheduled summaries of review activity, governance signals, findings, and advisory scans.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("digests-hub-tablist")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Browse" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Subscriptions" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Schedule" })).toBeInTheDocument();
    expect(screen.getByTestId("digests-refresh-button")).toBeEnabled();
    expect(screen.getByTestId("digests-last-updated")).toBeInTheDocument();
    expect(screen.getByTestId("digests-privacy-note")).toBeInTheDocument();
    expect(screen.getByTestId("digests-primary-action")).toHaveTextContent("Configure schedule");
    expect(screen.getByTestId("digests-preview-action")).toBeDisabled();
    expect(screen.getByRole("link", { name: "Send test digest" })).toHaveAttribute(
      "href",
      "/advisory?tab=schedules",
    );
    expect(screen.getByRole("link", { name: "Open advisory schedules" })).toBeInTheDocument();
    expect(screen.getByTestId("digests-browse-setup-message")).toBeInTheDocument();
    expect(screen.getByTestId("digests-browse-next-best-action")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("digest-setup-gaps")).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: "Open schedules" })).toHaveAttribute(
      "href",
      "/advisory?tab=schedules",
    );
    expect(document.body.textContent).not.toMatch(/Markdown digests|plain preformatted|v1:/i);
  });
});
