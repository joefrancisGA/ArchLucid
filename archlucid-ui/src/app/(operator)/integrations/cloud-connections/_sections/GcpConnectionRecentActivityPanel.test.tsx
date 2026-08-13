import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GcpConnectionDataProvider } from "./GcpConnectionDataContext";
import { GcpConnectionRecentActivityPanel } from "./GcpConnectionRecentActivityPanel";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/api/gcp-cloud-connections-api", () => ({
  listGcpTier2Connections: vi.fn(async () => []),
  triggerGcpTier2HostedRun: vi.fn(),
}));

describe("GcpConnectionRecentActivityPanel (P0-1)", () => {
  it("uses GCP-specific empty coach CTA anchored to connection details", async () => {
    render(
      <GcpConnectionDataProvider>
        <GcpConnectionRecentActivityPanel />
      </GcpConnectionDataProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("cloud-first-inventory-coach-cta")).toHaveTextContent("Configure GCP");
    });

    expect(screen.getByTestId("cloud-first-inventory-coach-cta")).toHaveAttribute("href", "#connection-details");
  });
});
