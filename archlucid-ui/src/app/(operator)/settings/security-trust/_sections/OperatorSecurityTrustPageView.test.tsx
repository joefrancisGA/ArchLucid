import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorSecurityTrustPageView } from "./OperatorSecurityTrustPageView";
import { textContainsGitHubBlobOrTreeUrl } from "@/lib/github-blob-url-contains";

describe("OperatorSecurityTrustPageView", () => {
  it("renders procurement-facing sections without GitHub blob links", () => {
    render(<OperatorSecurityTrustPageView />);

    expect(screen.getByText(/Security materials for procurement/i)).toBeInTheDocument();
    expect(screen.queryByText(/Review and evidence trail/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Trust Center/i })).toHaveAttribute("href", "/trust");
    expect(screen.getByRole("link", { name: /Procurement contact/i })).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:security@archlucid.net"),
    );
    expect(screen.getByText(/SOC 2 Type II readiness and audit engagement planning/i)).toBeInTheDocument();
    expect(screen.queryByText(/Formal SOC 2 Type II audit engagement/i)).not.toBeInTheDocument();
    expect(textContainsGitHubBlobOrTreeUrl(document.body.textContent ?? "")).toBe(false);
  });

  it("renders tenant isolation model with CAIQ technical detail link", () => {
    render(<OperatorSecurityTrustPageView />);

    expect(screen.getByRole("heading", { name: "Tenant isolation model" })).toBeInTheDocument();
    expect(screen.getByText(/dedicated database catalog/i)).toBeInTheDocument();
    expect(screen.getByText(/no cross-tenant data path/i)).toBeInTheDocument();
    const isolationSection = screen.getByLabelText("Tenant isolation model");

    expect(within(isolationSection).getByRole("link", { name: /CAIQ \/ SIG response/i })).toHaveAttribute(
      "href",
      "/help/caiq-sig-response",
    );
  });

  it("renders data retention section with deletion instructions and contractual links", () => {
    render(<OperatorSecurityTrustPageView />);

    const retentionSection = screen.getByLabelText("Data retention");

    expect(within(retentionSection).getByText(/duration of your workspace subscription/i)).toBeInTheDocument();
    expect(within(retentionSection).getByText(/deleted within 90 days/i)).toBeInTheDocument();
    expect(within(retentionSection).getByText(/request workspace data deletion/i)).toBeInTheDocument();
    expect(within(retentionSection).getByRole("link", { name: /DPA template/i })).toHaveAttribute(
      "href",
      "/help/dpa-template",
    );
    expect(within(retentionSection).getByRole("link", { name: /Privacy policy/i })).toHaveAttribute(
      "href",
      "/privacy",
    );
  });

  it("collapses badge legend by default", () => {
    render(<OperatorSecurityTrustPageView />);

    const legend = screen.getByText("Badge legend");

    expect(legend.tagName).toBe("SUMMARY");
    expect(screen.getByText("Need security review support?")).toBeInTheDocument();
  });
});
