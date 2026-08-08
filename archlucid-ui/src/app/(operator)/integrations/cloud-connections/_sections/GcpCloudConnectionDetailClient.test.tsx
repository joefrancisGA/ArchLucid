import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./GcpConnectionSection", () => ({
  GcpConnectionSection: () => <div data-testid="gcp-connection-section-stub" />,
}));

vi.mock("./CloudSecurityPreflightPanel", () => ({
  CloudSecurityPreflightPanel: () => <div data-testid="gcp-preflight-stub" />,
  CloudSecurityPreflightTechnicalDetails: ({ children }: { children: ReactNode }) => (
    <div data-testid="gcp-technical-details-stub">{children}</div>
  ),
}));

import { GcpCloudConnectionDetailClient } from "./GcpCloudConnectionDetailClient";

describe("GcpCloudConnectionDetailClient", () => {
  it("does not claim Preview for Tier 2 Done GCP (TB-1140)", () => {
    render(<GcpCloudConnectionDetailClient />);

    const detail = screen.getByTestId("cloud-connection-detail-gcp");

    expect(detail).toBeInTheDocument();
    expect(detail).not.toHaveTextContent(/Preview/i);
    expect(detail).toHaveTextContent(/Workload Identity Federation/i);
    expect(screen.queryByTestId("cloud-connection-gcp-orientation")).toBeNull(); // TB-2092
  });
});
