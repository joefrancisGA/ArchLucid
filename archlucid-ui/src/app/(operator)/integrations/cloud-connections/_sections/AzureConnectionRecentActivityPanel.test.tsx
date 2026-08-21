import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AzureConnectionDataProvider } from "./AzureConnectionDataContext";
import { AzureConnectionRecentActivityPanel } from "./AzureConnectionRecentActivityPanel";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/api/cloud-connections-api", () => ({
  listTier2Connections: vi.fn(async () => []),
  validateTier2ConnectionHostedRun: vi.fn(),
}));

describe("AzureConnectionRecentActivityPanel (P0-1)", () => {
  it("keeps Azure-scoped empty coach without a Configure CTA on this page", async () => {
    render(
      <AzureConnectionDataProvider>
        <AzureConnectionRecentActivityPanel />
      </AzureConnectionDataProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("cloud-first-inventory-coach")).toHaveTextContent("Azure");
    });

    expect(screen.getByTestId("cloud-first-inventory-coach")).toHaveAttribute("data-phase", "empty");
    expect(screen.queryByTestId("cloud-first-inventory-coach-cta")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /configure azure/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("azure-connection-recent-activity-empty")).toBeInTheDocument();
  });
});
