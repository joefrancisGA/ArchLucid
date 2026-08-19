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
  it("uses AWS-specific empty coach CTA anchored to connection details", async () => {
    render(
      <AwsConnectionDataProvider>
        <AwsConnectionRecentActivityPanel />
      </AwsConnectionDataProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("cloud-first-inventory-coach-cta")).toHaveTextContent("Configure AWS");
    });

    expect(screen.getByTestId("cloud-first-inventory-coach-cta")).toHaveAttribute("href", "#connection-details");
  });
});
