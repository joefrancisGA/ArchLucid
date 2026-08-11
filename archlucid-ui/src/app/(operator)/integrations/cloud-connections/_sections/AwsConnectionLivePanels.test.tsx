import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AwsConnectionDataProvider } from "./AwsConnectionDataContext";
import { AwsConnectionRecentActivityPanel } from "./AwsConnectionRecentActivityPanel";
import { AwsConnectionSection } from "./AwsConnectionSection";
import { AwsConnectionValidatePanel } from "./AwsConnectionValidatePanel";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/api/aws-cloud-connections-api", () => ({
  listAwsTier2Connections: vi.fn(async () => [
    {
      connectionId: "conn-1",
      accountId: "123456789012",
      region: "us-east-1",
      roleArn: "arn:aws:iam::123456789012:role/ArchLucidReadOnly",
      status: "connected",
      lastPolledUtc: "2026-08-10T12:00:00.000Z",
      updatedUtc: "2026-08-10T12:00:00.000Z",
    },
  ]),
  configureAwsTier2Connection: vi.fn(async () => undefined),
  disconnectAwsTier2Connection: vi.fn(async () => undefined),
  triggerAwsTier2HostedRun: vi.fn(async () => ({ resourceCount: 12, packageId: "pkg-1" })),
}));

describe("AWS connection live panels (TB-1762)", () => {
  it("renders live validate and recent activity from connection list", async () => {
    render(
      <AwsConnectionDataProvider>
        <AwsConnectionValidatePanel />
        <AwsConnectionRecentActivityPanel />
      </AwsConnectionDataProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("aws-connection-validate-panel")).toHaveTextContent("123456789012");
      expect(screen.getByTestId("aws-connection-recent-activity-panel")).toHaveTextContent("123456789012");
    });

    expect(screen.getByTestId("aws-validate-repoll-conn-1")).toBeInTheDocument();
    expect(screen.queryByText(/appear in Connection details after you save/i)).not.toBeInTheDocument();
  });

  it("shows an AWS-scoped empty recent-activity state without hub coach copy (P0-7)", async () => {
    const { listAwsTier2Connections } = await import("@/lib/api/aws-cloud-connections-api");
    vi.mocked(listAwsTier2Connections).mockResolvedValueOnce([]);

    render(
      <AwsConnectionDataProvider>
        <AwsConnectionRecentActivityPanel />
      </AwsConnectionDataProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("aws-connection-recent-activity-panel")).toHaveTextContent(
        "No collection activity yet for this AWS account",
      );
    });

    expect(screen.queryByText(/0 of 3 cloud providers connected/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Configure connection details" })).toHaveAttribute(
      "href",
      "#connection-details",
    );
  });

  it("reports a re-poll result in the panel that triggered it, exactly once", async () => {
    render(
      <AwsConnectionDataProvider>
        <AwsConnectionSection embedded />
        <AwsConnectionValidatePanel />
      </AwsConnectionDataProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("aws-validate-repoll-conn-1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("aws-validate-repoll-conn-1"));

    await waitFor(() => {
      expect(screen.getByTestId("aws-connection-validate-status")).toBeInTheDocument();
    });

    const connectionSection = screen.getByTestId("cloud-connections-available-aws");
    expect(within(connectionSection).queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });
});
