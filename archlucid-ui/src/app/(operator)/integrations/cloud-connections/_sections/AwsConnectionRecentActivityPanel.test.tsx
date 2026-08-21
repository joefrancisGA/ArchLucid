import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AwsConnectionDataProvider } from "./AwsConnectionDataContext";
import { AwsConnectionRecentActivityPanel } from "./AwsConnectionRecentActivityPanel";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/api/aws-cloud-connections-api", () => ({
  listAwsTier2Connections: vi.fn(async () => []),
  triggerAwsTier2HostedRun: vi.fn(),
}));

describe("AwsConnectionRecentActivityPanel (P0-1)", () => {
  it("keeps AWS-scoped empty coach without a Configure CTA on this page", async () => {
    render(
      <AwsConnectionDataProvider>
        <AwsConnectionRecentActivityPanel />
      </AwsConnectionDataProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("cloud-first-inventory-coach")).toHaveTextContent("AWS");
    });

    expect(screen.queryByTestId("cloud-first-inventory-coach-cta")).not.toBeInTheDocument();
    expect(screen.getByTestId("aws-connection-recent-activity-empty")).toBeInTheDocument();
  });
});
