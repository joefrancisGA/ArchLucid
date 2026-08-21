import { render, screen, waitFor, within } from "@testing-library/react";
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

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/api/aws-cloud-connections-api", () => ({
  listAwsTier2Connections: vi.fn(async () => []),
  triggerAwsTier2HostedRun: vi.fn(),
}));

import { AwsCloudConnectionDetailClient } from "./AwsCloudConnectionDetailClient";
import { AWS_CLOUD_CONNECTION_BANNED_COPY } from "@/lib/aws-cloud-connection-copy";
import { CLOUD_PROVIDER_CONNECTION_CLAIM_DISCIPLINE } from "@/lib/cloud-provider-connection-evidence-copy";

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

  it("shows connection status in the page header and mounts claim-discipline sources (P0-3, P0-8)", async () => {
    render(<AwsCloudConnectionDetailClient />);

    await waitFor(() => {
      expect(screen.getByTestId("aws-connection-header-status")).toHaveTextContent("Not connected");
    });

    expect(screen.getByTestId("aws-connection-header-connect")).toHaveTextContent("Connect AWS account");
    expect(screen.getByTestId("aws-connection-header-connect")).toHaveAttribute("href", "#connection-details");
    expect(screen.getByRole("heading", { name: "Recent connection activity" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View setup guide" })).toHaveAttribute(
      "href",
      "/help/cloud-connections/aws",
    );

    expect(screen.getByTestId("page-contextual-help-button")).toHaveTextContent("Help");
    expect(screen.getByTestId("cloud-connections-aws-claim-discipline")).toHaveTextContent(
      CLOUD_PROVIDER_CONNECTION_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("cloud-connections-aws-sources")).toBeInTheDocument();
    const sources = screen.getByTestId("cloud-connections-aws-sources");
    expect(within(sources).getByRole("link", { name: "Connection status" })).toHaveAttribute(
      "href",
      "/administration/connection-status",
    );
    expect(within(sources).queryByRole("link", { name: /Configure AWS/i })).not.toBeInTheDocument();
    expect(
      within(sources).queryByRole("link", { name: /integrations\/cloud-connections\/aws/i }),
    ).not.toBeInTheDocument();
  });

  it("does not claim Not connected when the connection list fails to load", async () => {
    const { listAwsTier2Connections } = await import("@/lib/api/aws-cloud-connections-api");
    vi.mocked(listAwsTier2Connections).mockRejectedValueOnce(new Error("network"));

    render(<AwsCloudConnectionDetailClient />);

    await waitFor(() => {
      expect(screen.getByTestId("aws-connection-header-status")).toHaveTextContent("Status unavailable");
    });

    expect(screen.getByTestId("aws-connection-header-status")).not.toHaveTextContent("Not connected");
    expect(screen.queryByTestId("aws-connection-header-connect")).not.toBeInTheDocument();
  });
});
