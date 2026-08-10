import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./AwsConnectionSection", () => ({
  AwsConnectionSection: () => <div data-testid="aws-connection-section-stub" />,
}));

vi.mock("./AwsConnectionValidatePanel", () => ({
  AwsConnectionValidatePanel: () => <div data-testid="aws-connection-validate-panel" />,
}));

vi.mock("./AwsConnectionRecentActivityPanel", () => ({
  AwsConnectionRecentActivityPanel: () => <div data-testid="aws-connection-recent-activity-panel" />,
}));

vi.mock("./CloudSecurityPreflightPanel", () => ({
  CloudSecurityPreflightPanel: () => <div data-testid="aws-preflight-stub" />,
  CloudSecurityPreflightTechnicalDetails: ({ children }: { children: ReactNode }) => (
    <div data-testid="aws-technical-details-stub">{children}</div>
  ),
}));

import { AwsCloudConnectionDetailClient } from "./AwsCloudConnectionDetailClient";

describe("AwsCloudConnectionDetailClient", () => {
  it("mounts live Validate and Recent activity panels instead of static stubs (TB-1762)", () => {
    render(<AwsCloudConnectionDetailClient />);

    expect(screen.getByTestId("aws-connection-validate-panel")).toBeInTheDocument();
    expect(screen.getByTestId("aws-connection-recent-activity-panel")).toBeInTheDocument();
    expect(screen.queryByText(/appear in Connection details after you save/i)).not.toBeInTheDocument();
  });
});
