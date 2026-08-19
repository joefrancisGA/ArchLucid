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
  it("uses Azure-specific empty coach CTA anchored to connection details", async () => {
    render(
      <AzureConnectionDataProvider>
        <AzureConnectionRecentActivityPanel />
      </AzureConnectionDataProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("cloud-first-inventory-coach-cta")).toHaveTextContent("Configure Azure");
    });

    expect(screen.getByTestId("cloud-first-inventory-coach-cta")).toHaveAttribute("href", "#connection-details");
  });
});
