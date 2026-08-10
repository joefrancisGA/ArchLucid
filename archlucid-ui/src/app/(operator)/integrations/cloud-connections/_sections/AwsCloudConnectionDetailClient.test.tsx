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
import { AWS_CLOUD_CONNECTION_BANNED_COPY } from "@/lib/aws-cloud-connection-copy";

describe("AwsCloudConnectionDetailClient", () => {
  it("mounts live Validate and Recent activity panels instead of static stubs (TB-1762)", () => {
    render(<AwsCloudConnectionDetailClient />);

    expect(screen.getByTestId("aws-connection-validate-panel")).toBeInTheDocument();
    expect(screen.getByTestId("aws-connection-recent-activity-panel")).toBeInTheDocument();
    expect(screen.queryByText(/appear in Connection details after you save/i)).not.toBeInTheDocument();
  });

  it("does not surface Tier/hosted-poll jargon on the AWS product surface (TB-1763)", () => {
    render(<AwsCloudConnectionDetailClient />);

    const detail = screen.getByTestId("cloud-connection-detail-aws");
    const text = detail.textContent ?? "";

    for (const banned of AWS_CLOUD_CONNECTION_BANNED_COPY) {
      expect(text.toLowerCase()).not.toContain(banned.toLowerCase());
    }
  });

  it("exposes federation identifiers and a copyable IAM trust-policy starter (TB-1765)", () => {
    render(<AwsCloudConnectionDetailClient />);

    expect(screen.getByTestId("aws-trust-starter-panel")).toBeInTheDocument();
    expect(screen.getByTestId("aws-trust-starter-federation-identifiers")).toBeInTheDocument();
    expect(screen.getByText("api://AzureADTokenExchange")).toBeInTheDocument();

    const trustPolicyTemplate = screen.getByTestId("aws-trust-starter-trust-policy-template");
    expect(trustPolicyTemplate).toHaveTextContent("sts:AssumeRoleWithWebIdentity");
    expect(trustPolicyTemplate).toHaveTextContent("sts.windows.net/{ArchLucid tenant ID}");
    expect(screen.getByTestId("aws-trust-starter-trust-policy-copy")).toBeInTheDocument();
  });
});
