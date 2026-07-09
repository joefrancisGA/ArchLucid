import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DigestsBrowseContent } from "@/components/digests/DigestsBrowseContent";
import {
  DIGESTS_BROWSE_EMPTY_TITLE,
  DIGESTS_BROWSE_INCLUDES_SECTION_TITLE,
} from "@/lib/digests-browse-copy";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/api", () => ({
  listArchitectureDigests: vi.fn(),
  getArchitectureDigest: vi.fn(),
  listDigestDeliveryAttempts: vi.fn(),
}));

import {
  listArchitectureDigests,
  listDigestDeliveryAttempts,
} from "@/lib/api";

const healthSnap: WeeklyDigestHealthDto = {
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
    "No digest subscriptions — generated digests have no outbound recipients in this scope.",
  ],
};

describe("DigestsBrowseContent", () => {
  beforeEach(() => {
    vi.mocked(listArchitectureDigests).mockReset();
    vi.mocked(listDigestDeliveryAttempts).mockReset();
  });

  it("renders setup checklist, includes preview, and summary empty state without duplicate CTAs", async () => {
    vi.mocked(listArchitectureDigests).mockResolvedValue([]);

    render(<DigestsBrowseContent hidePageHeader healthSnap={healthSnap} />);

    expect(await screen.findByTestId("digests-empty-state")).toBeInTheDocument();
    expect(screen.getByText(DIGESTS_BROWSE_EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("digests-browse-setup-checklist")).toBeInTheDocument();
    expect(screen.getByText("Configure schedule")).toBeInTheDocument();
    expect(screen.getByText("Add recipients or subscriptions")).toBeInTheDocument();
    expect(screen.getByTestId("digests-browse-includes-preview")).toBeInTheDocument();
    expect(screen.getByText(DIGESTS_BROWSE_INCLUDES_SECTION_TITLE)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Create subscription" })).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Markdown|v1|preformatted/i);
  });

  it("renders digest history table when digests exist", async () => {
    vi.mocked(listArchitectureDigests).mockResolvedValue([
      {
        digestId: "d1",
        tenantId: "t",
        workspaceId: "w",
        projectId: "p",
        generatedUtc: "2026-07-08T12:00:00Z",
        title: "Weekly architecture digest",
        summary: "Summary line",
        contentMarkdown: "# Body",
        metadataJson: "{}",
      },
    ]);
    vi.mocked(listDigestDeliveryAttempts).mockResolvedValue([
      {
        attemptId: "a1",
        digestId: "d1",
        subscriptionId: "s1",
        attemptedUtc: "2026-07-08T12:05:00Z",
        status: "Delivered",
        channelType: "Email",
        destination: "ops@example.com",
      },
    ]);

    render(<DigestsBrowseContent hidePageHeader healthSnap={healthSnap} />);

    expect(await screen.findByRole("table", { name: "Architecture digest history" })).toBeInTheDocument();
    expect(screen.getByText("Weekly architecture digest")).toBeInTheDocument();
    expect(screen.getByText("ops@example.com")).toBeInTheDocument();
  });
});
