import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DigestsBrowseContent } from "@/components/digests/DigestsBrowseContent";

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

describe("DigestsBrowseContent", () => {
  beforeEach(() => {
    vi.mocked(listArchitectureDigests).mockReset();
    vi.mocked(listDigestDeliveryAttempts).mockReset();
  });

  it("renders intentional empty state without implementation jargon", async () => {
    vi.mocked(listArchitectureDigests).mockResolvedValue([]);

    render(<DigestsBrowseContent hidePageHeader />);

    expect(await screen.findByTestId("digests-empty-state")).toBeInTheDocument();
    expect(screen.getByText("No digests generated yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Configure schedule" })).toHaveAttribute(
      "href",
      "/digests?tab=schedule",
    );
    expect(screen.getByRole("link", { name: "Create subscription" })).toHaveAttribute(
      "href",
      "/digests?tab=subscriptions",
    );
    expect(screen.getByRole("link", { name: "Send test digest" })).toHaveAttribute(
      "href",
      "/advisory?tab=schedules",
    );
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

    render(<DigestsBrowseContent hidePageHeader />);

    await waitFor(() => {
      expect(screen.getByRole("table", { name: "Architecture digest history" })).toBeInTheDocument();
    });
    expect(screen.getByText("Weekly architecture digest")).toBeInTheDocument();
    expect(screen.getByText("ops@example.com")).toBeInTheDocument();
  });
});
