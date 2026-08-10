import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AwsConnectionDataProvider } from "./AwsConnectionDataContext";
import { AwsConnectionRecentActivityPanel } from "./AwsConnectionRecentActivityPanel";
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
  triggerAwsTier2HostedRun: vi.fn(),
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
});
