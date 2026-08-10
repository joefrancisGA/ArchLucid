import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GcpConnectionDataProvider } from "./GcpConnectionDataContext";
import { GcpConnectionRecentActivityPanel } from "./GcpConnectionRecentActivityPanel";
import { GcpConnectionValidatePanel } from "./GcpConnectionValidatePanel";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/api/gcp-cloud-connections-api", () => ({
  listGcpTier2Connections: vi.fn(async () => [
    {
      connectionId: "conn-1",
      projectId: "demo-project",
      workloadIdentityPoolProvider:
        "projects/1/locations/global/workloadIdentityPools/pool/providers/azure-ad",
      serviceAccountEmail: "reader@demo-project.iam.gserviceaccount.com",
      status: "connected",
      lastPolledUtc: "2026-08-10T12:00:00.000Z",
      updatedUtc: "2026-08-10T12:00:00.000Z",
    },
  ]),
  triggerGcpTier2HostedRun: vi.fn(),
}));

describe("GCP connection live panels (TB-1773)", () => {
  it("renders live validate and recent activity from connection list", async () => {
    render(
      <GcpConnectionDataProvider>
        <GcpConnectionValidatePanel />
        <GcpConnectionRecentActivityPanel />
      </GcpConnectionDataProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("gcp-connection-validate-panel")).toHaveTextContent("demo-project");
      expect(screen.getByTestId("gcp-connection-recent-activity-panel")).toHaveTextContent("demo-project");
    });

    expect(screen.getByTestId("gcp-validate-repoll-conn-1")).toBeInTheDocument();
    expect(screen.queryByText(/appear in Connection details after you save/i)).not.toBeInTheDocument();
  });
});
