import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorSecurityTrustPageView } from "./OperatorSecurityTrustPageView";
import { textContainsGitHubBlobOrTreeUrl } from "@/lib/github-blob-url-contains";

describe("OperatorSecurityTrustPageView", () => {
  it("renders procurement-facing sections without GitHub blob links", () => {
    render(<OperatorSecurityTrustPageView />);

    expect(screen.getByText(/Security materials for procurement/i)).toBeInTheDocument();
    expect(screen.queryByText(/Review and evidence trail/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Trust Center/i })[0]).toHaveAttribute("href", "/trust");
    expect(screen.getByRole("link", { name: /Procurement contact/i })).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:security@archlucid.net"),
    );
    expect(screen.getByText(/SOC 2 Type II readiness and audit engagement planning/i)).toBeInTheDocument();
    expect(screen.queryByText(/Formal SOC 2 Type II audit engagement/i)).not.toBeInTheDocument();
    expect(textContainsGitHubBlobOrTreeUrl(document.body.textContent ?? "")).toBe(false);
  });

  it("renders soft tenant isolation copy without absolute no-cross-tenant claim (TB-1284)", () => {
    render(<OperatorSecurityTrustPageView />);

    expect(screen.getByRole("heading", { name: "Tenant isolation model" })).toBeInTheDocument();
    expect(screen.getByText(/dedicated database catalog/i)).toBeInTheDocument();
    expect(screen.getByText(/tenant scope that the data layer enforces/i)).toBeInTheDocument();
    expect(screen.getByText(/standard customer path/i)).toBeInTheDocument();

    const isolationSection = screen.getByLabelText("Tenant isolation model");
    const visible = (isolationSection.textContent ?? "").toLowerCase();

    expect(visible).not.toContain("no cross-tenant data path");
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

  it("uses StatusTag maturity badges on sections and legend (TB-1285 / TB-1286)", () => {
    render(<OperatorSecurityTrustPageView />);

    const page = screen.getByTestId("operator-security-trust-page");

    expect(page.className).toContain("space-y-4");

    expect(screen.getByTestId("security-trust-maturity-Available now")).toHaveTextContent("Available now");
    expect(screen.getByTestId("security-trust-maturity-Under NDA")).toHaveTextContent("Under NDA");
    expect(screen.getByTestId("security-trust-maturity-Roadmap")).toHaveTextContent("Roadmap");

    expect(screen.getByTestId("security-trust-legend-Available now")).toHaveTextContent("Available now");
    expect(screen.getByTestId("security-trust-legend-Under NDA")).toHaveTextContent("Under NDA");
    expect(screen.getByTestId("security-trust-legend-Roadmap")).toHaveTextContent("Roadmap");

    expect(document.querySelector(".rounded-full")).toBeNull();
    expect(document.querySelector('[class*="bg-violet-100"]')).toBeNull();
  });
});
