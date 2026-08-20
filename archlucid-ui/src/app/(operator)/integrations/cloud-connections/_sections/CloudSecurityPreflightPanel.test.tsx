import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { cloudSecurityPreflightTopics } from "@/lib/cloud-security-preflight-topics";

import { CloudSecurityPreflightPanel } from "./CloudSecurityPreflightPanel";

describe("CloudSecurityPreflightPanel", () => {
  it("renders a read-only checklist without attestation controls (P0-2)", () => {
    render(
      <CloudSecurityPreflightPanel
        topics={cloudSecurityPreflightTopics("aws")}
        providerLabel="AWS"
        collapsedByDefault={false}
      />,
    );

    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByText(/security review is recommended/i)).not.toBeInTheDocument();
    expect(screen.getByText("Read-only scope")).toBeInTheDocument();
  });

  it("collapses to a one-line summary by default when requested (P0-2)", () => {
    render(
      <CloudSecurityPreflightPanel
        topics={cloudSecurityPreflightTopics("azure")}
        providerLabel="Azure"
        collapsedByDefault
      />,
    );

    expect(screen.getByText(/7 access controls reviewed for Azure/i)).toBeInTheDocument();
    expect(screen.getByText("Read-only scope")).not.toBeVisible();
  });

  it("expands cited topics after the summary is opened (P0-2)", () => {
    render(
      <CloudSecurityPreflightPanel
        topics={cloudSecurityPreflightTopics("azure")}
        providerLabel="Azure"
        collapsedByDefault
      />,
    );

    fireEvent.click(screen.getByText(/7 access controls reviewed for Azure/i));

    expect(screen.getByText("Read-only scope")).toBeVisible();
  });

  it("links AWS federation citations to AWS help instead of Azure workload identity", () => {
    render(<CloudSecurityPreflightPanel topics={cloudSecurityPreflightTopics("aws")} providerLabel="AWS" />);

    fireEvent.click(screen.getByText(/7 access controls reviewed for AWS/i));

    expect(screen.getByTestId("cloud-security-preflight-citation-identity-federation")).toHaveAttribute(
      "href",
      "/help/cloud-connections/aws",
    );
    expect(screen.getByTestId("cloud-security-preflight-citation-aws-role-trust")).toHaveAttribute(
      "href",
      "/help/cloud-connections/aws",
    );
  });

  it("links every topic to a trust-center control and shows verified tags after validation (P0-5)", () => {
    const topics = cloudSecurityPreflightTopics("azure");
    const verifiedUtc = "2026-08-12T12:00:00.000Z";

    render(
      <CloudSecurityPreflightPanel
        topics={topics}
        providerLabel="Azure"
        verifiedTopics={{ "read-only-scope": { verifiedUtc } }}
      />,
    );

    for (const topic of topics) {
      expect(screen.getByTestId(`cloud-security-preflight-citation-${topic.id}`)).toHaveAttribute("href");
    }

    expect(screen.getByTestId("cloud-security-preflight-verified-read-only-scope")).toHaveTextContent(/Verified/i);
  });
});
