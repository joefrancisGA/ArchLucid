import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DigestsBrowseContent } from "@/components/digests/DigestsBrowseContent";
import { renderWithOperatorQuery } from "@/testing/operator-query-test-helpers";
import { DIGEST_EXPORT_ACTION_LABEL } from "@/lib/digest-delivery-presentation";
import {
  DIGEST_COVERAGE_COLUMN_HEADER,
  DIGEST_COVERAGE_COMPARED_LABEL,
} from "@/lib/digest-period-coverage";
import { digestRowElementId } from "@/lib/digests-browse-deep-link";
import {
  DIGESTS_BROWSE_INCLUDES_SECTION_TITLE,
  DIGESTS_BROWSE_SETUP_UNKNOWN_TITLE,
} from "@/lib/digests-browse-copy";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";

const digestBrowseApiMocks = vi.hoisted(() => ({
  listArchitectureDigests: vi.fn(),
  getArchitectureDigest: vi.fn(),
  listDigestDeliveryAttempts: vi.fn(),
  listDigestDeliveryAttemptsBatch: vi.fn(),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/api", () => digestBrowseApiMocks);

vi.mock("@/lib/api/advisory-digests-api", () => digestBrowseApiMocks);

import {
  getArchitectureDigest,
  listArchitectureDigests,
  listDigestDeliveryAttempts,
  listDigestDeliveryAttemptsBatch,
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

const digestRow = {
  digestId: "d1",
  tenantId: "t",
  workspaceId: "w",
  projectId: "p",
  runId: "aaaaaaaa-1111-2222-3333-444444444444",
  comparedToRunId: "bbbbbbbb-5555-6666-7777-888888888888",
  generatedUtc: "2026-07-08T12:00:00Z",
  title: "Weekly architecture digest",
  summary: "Summary line",
  contentMarkdown: "# Body",
  metadataJson: "{}",
};

describe("DigestsBrowseContent", () => {
  beforeEach(() => {
    vi.mocked(listArchitectureDigests).mockReset();
    vi.mocked(listDigestDeliveryAttempts).mockReset();
    vi.mocked(listDigestDeliveryAttemptsBatch).mockReset();
    vi.mocked(getArchitectureDigest).mockReset();
    vi.mocked(listDigestDeliveryAttemptsBatch).mockResolvedValue([]);
    window.location.hash = "";
  });

  it("shows a structured skeleton while the first list load runs (TB-1502)", async () => {
    let resolveList: (rows: (typeof digestRow)[]) => void = () => undefined;
    vi.mocked(listArchitectureDigests).mockReturnValue(
      new Promise((resolve) => {
        resolveList = resolve;
      }),
    );

    renderWithOperatorQuery(<DigestsBrowseContent hidePageHeader healthSnap={healthSnap} />);

    expect(screen.getByTestId("digests-browse-skeleton")).toBeInTheDocument();
    expect(screen.queryByText("Loading digests…")).not.toBeInTheDocument();

    resolveList([]);

    await waitFor(() => {
      expect(screen.queryByTestId("digests-browse-skeleton")).not.toBeInTheDocument();
    });
  });

  it("renders one guided empty composition, not a stacked tower (TB-1480)", async () => {
    vi.mocked(listArchitectureDigests).mockResolvedValue([]);

    renderWithOperatorQuery(<DigestsBrowseContent hidePageHeader healthSnap={healthSnap} />);

    const empty = await screen.findByTestId("digests-browse-empty-state");

    // Exactly one next-step story: the checklist. No competing summary empty state.
    expect(within(empty).getByTestId("digests-browse-setup-checklist")).toBeInTheDocument();
    expect(screen.queryByTestId("digests-empty-state")).not.toBeInTheDocument();

    // Includes preview stays behind disclosure until the operator expands it (TB-1480).
    expect(within(empty).getByTestId("digests-browse-includes-disclosure")).toBeInTheDocument();
    expect(screen.getByText(DIGESTS_BROWSE_INCLUDES_SECTION_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("digests-browse-includes-disclosure")).not.toHaveAttribute("open");
  });

  it("keeps the checklist history step status-only instead of self-linking to Browse", async () => {
    vi.mocked(listArchitectureDigests).mockResolvedValue([]);

    renderWithOperatorQuery(<DigestsBrowseContent hidePageHeader healthSnap={healthSnap} />);

    const historyStep = await screen.findByTestId("digests-browse-checklist-item-history");

    expect(within(historyStep).queryByRole("link")).not.toBeInTheDocument();
    expect(within(historyStep).getByText("Pending")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Review generated history" })).not.toBeInTheDocument();
  });

  it("falls back to an honest empty state when setup status could not be read", async () => {
    vi.mocked(listArchitectureDigests).mockResolvedValue([]);

    renderWithOperatorQuery(<DigestsBrowseContent hidePageHeader healthSnap={null} />);

    expect(await screen.findByTestId("digests-empty-state")).toBeInTheDocument();
    expect(screen.getByText(DIGESTS_BROWSE_SETUP_UNKNOWN_TITLE)).toBeInTheDocument();
    expect(screen.queryByTestId("digests-browse-setup-checklist")).not.toBeInTheDocument();
  });

  it("renders honest coverage instead of Compared/Current labels (TB-1503)", async () => {
    vi.mocked(listArchitectureDigests).mockResolvedValue([digestRow]);
    vi.mocked(listDigestDeliveryAttemptsBatch).mockResolvedValue([{ digestId: "d1", attempts: [] }]);

    renderWithOperatorQuery(<DigestsBrowseContent hidePageHeader healthSnap={healthSnap} />);

    expect(await screen.findByRole("table", { name: "Architecture digest history" })).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: DIGEST_COVERAGE_COLUMN_HEADER }),
    ).toBeInTheDocument();
    expect(screen.getByText(DIGEST_COVERAGE_COMPARED_LABEL)).toBeInTheDocument();
    expect(screen.getByText("bbbbbbbb → aaaaaaaa")).toBeInTheDocument();
    expect(screen.queryByText("Compared period")).not.toBeInTheDocument();
    expect(screen.queryByText("Current period")).not.toBeInTheDocument();
  });

  it("gives each history row a stable id for the #digest hash target (TB-1501)", async () => {
    vi.mocked(listArchitectureDigests).mockResolvedValue([digestRow]);
    vi.mocked(listDigestDeliveryAttemptsBatch).mockResolvedValue([{ digestId: "d1", attempts: [] }]);

    renderWithOperatorQuery(<DigestsBrowseContent hidePageHeader healthSnap={healthSnap} />);

    await screen.findByRole("table", { name: "Architecture digest history" });

    expect(document.getElementById(digestRowElementId("d1"))).not.toBeNull();
  });

  it("auto-selects the digest named in the location hash (TB-1501)", async () => {
    window.location.hash = "#digest-d1";
    vi.mocked(listArchitectureDigests).mockResolvedValue([digestRow]);
    vi.mocked(listDigestDeliveryAttemptsBatch).mockResolvedValue([{ digestId: "d1", attempts: [] }]);
    vi.mocked(listDigestDeliveryAttempts).mockResolvedValue([]);
    vi.mocked(getArchitectureDigest).mockResolvedValue(digestRow);

    renderWithOperatorQuery(<DigestsBrowseContent hidePageHeader healthSnap={healthSnap} />);

    await waitFor(() => {
      expect(getArchitectureDigest).toHaveBeenCalledWith("d1");
    });

    expect(await screen.findByTestId("digests-preview-body")).toHaveTextContent("# Body");
    expect(screen.getByRole("button", { name: DIGEST_EXPORT_ACTION_LABEL })).toBeInTheDocument();
  });

  it("ignores a hash that does not match a listed digest", async () => {
    window.location.hash = "#digest-missing";
    vi.mocked(listArchitectureDigests).mockResolvedValue([digestRow]);
    vi.mocked(listDigestDeliveryAttemptsBatch).mockResolvedValue([{ digestId: "d1", attempts: [] }]);

    renderWithOperatorQuery(<DigestsBrowseContent hidePageHeader healthSnap={healthSnap} />);

    await screen.findByRole("table", { name: "Architecture digest history" });

    expect(getArchitectureDigest).not.toHaveBeenCalled();
  });

  it("maps delivery status and hides raw exception text (TB-1504)", async () => {
    const failedAttempt = {
      attemptId: "a1",
      digestId: "d1",
      subscriptionId: "s1",
      attemptedUtc: "2026-07-08T12:05:00Z",
      status: "Failed",
      channelType: "Email",
      destination: "ops@example.com",
      errorMessage: "smtp timeout: System.Net.Mail.SmtpException",
    };

    vi.mocked(listArchitectureDigests).mockResolvedValue([digestRow]);
    vi.mocked(listDigestDeliveryAttemptsBatch).mockResolvedValue([
      { digestId: "d1", attempts: [failedAttempt] },
    ]);
    vi.mocked(listDigestDeliveryAttempts).mockResolvedValue([failedAttempt]);
    vi.mocked(getArchitectureDigest).mockResolvedValue(digestRow);

    renderWithOperatorQuery(<DigestsBrowseContent hidePageHeader healthSnap={healthSnap} />);

    await screen.findByRole("table", { name: "Architecture digest history" });
    fireEvent.click(screen.getByRole("button", { name: "Weekly architecture digest" }));

    const attempts = await screen.findByTestId("digests-delivery-attempts");

    expect(within(attempts).getByText(/Delivery failed/)).toBeInTheDocument();
    expect(within(attempts).queryByText(/SmtpException/)).not.toBeInTheDocument();

    // Raw diagnostic stays available, but only inside Technical details.
    const diagnostics = screen.getByTestId("digests-delivery-diagnostics");

    expect(within(diagnostics).getByText(/SmtpException/)).toBeInTheDocument();
  });

  it("renders the digest history table when digests exist", async () => {
    const succeededAttempt = {
      attemptId: "a1",
      digestId: "d1",
      subscriptionId: "s1",
      attemptedUtc: "2026-07-08T12:05:00Z",
      status: "Succeeded",
      channelType: "Email",
      destination: "ops@example.com",
    };
    vi.mocked(listArchitectureDigests).mockResolvedValue([digestRow]);
    vi.mocked(listDigestDeliveryAttemptsBatch).mockResolvedValue([
      { digestId: "d1", attempts: [succeededAttempt] },
    ]);

    renderWithOperatorQuery(<DigestsBrowseContent hidePageHeader healthSnap={healthSnap} />);

    expect(await screen.findByRole("table", { name: "Architecture digest history" })).toBeInTheDocument();
    expect(screen.getByTestId("digests-browse-continue-last-viewed-row")).toBeInTheDocument();
    expect(screen.getAllByText("Weekly architecture digest").length).toBeGreaterThanOrEqual(1);
    await waitFor(() => {
      expect(screen.getByText("ops@example.com")).toBeInTheDocument();
    });
  });
});
