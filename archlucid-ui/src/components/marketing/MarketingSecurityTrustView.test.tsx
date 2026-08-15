import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingSecurityTrustView } from "./MarketingSecurityTrustView";
import { securityTrustEngagementRows } from "@/lib/security-trust-content";

describe("MarketingSecurityTrustView", () => {
  it("renders Assurance status as the page title", () => {
    render(<MarketingSecurityTrustView />);

    expect(screen.getByRole("heading", { level: 1, name: "Assurance status" })).toBeInTheDocument();
  });

  it("renders skip link and hero metadata", () => {
    render(<MarketingSecurityTrustView lastReviewedUtc="2026-08-15T12:00:00.000Z" />);

    expect(screen.getByRole("link", { name: /Skip to assurance status content/i })).toHaveAttribute(
      "href",
      "#assurance-status-primary-content",
    );
    expect(screen.getByTestId("assurance-status-hero-meta")).toHaveTextContent("Last reviewed");
    expect(screen.getByTestId("assurance-status-hero-meta")).toHaveTextContent("Evidence pack version");
  });

  it("renders all five engagement rows from the content lib", () => {
    render(<MarketingSecurityTrustView />);

    expect(securityTrustEngagementRows).toHaveLength(5);

    for (const row of securityTrustEngagementRows) {
      const rowEl = screen.getByTestId(`assurance-row-${row.id}`);
      expect(within(rowEl).getByText(row.engagement)).toBeInTheDocument();
      expect(within(rowEl).getByTestId("assurance-vendor")).toHaveTextContent(row.vendor);
      expect(within(rowEl).getByText(row.scope)).toBeInTheDocument();
      expect(within(rowEl).getByText(row.completedUtc)).toBeInTheDocument();
    }
  });

  it("does not expose redacted content or customer names", () => {
    const { container } = render(<MarketingSecurityTrustView />);
    const text = container.textContent ?? "";

    expect(text.toLowerCase()).not.toMatch(/cve-\d{4}-\d+/);
    expect(text.toLowerCase()).not.toMatch(/cvss[:\s]*\d/);
    expect(text.toLowerCase()).not.toMatch(/severity[:\s]+(critical|high|medium|low)/);
    expect(text.toLowerCase()).not.toMatch(/customer:\s*[a-z]/);
    expect(text).not.toMatch(/PENDING_QUESTIONS/i);
    expect(text).not.toMatch(/2026-04-29/i);
  });

  it("uses security contact labeling instead of procurement contact", () => {
    render(<MarketingSecurityTrustView />);

    expect(screen.getByText(/Security and due-diligence contact/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Procurement contact:/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/security@archlucid\.net/i).length).toBeGreaterThan(0);
  });

  it("avoids internal procedural phrasing in customer-facing copy", () => {
    const { container } = render(<MarketingSecurityTrustView />);
    const text = container.textContent ?? "";

    expect(text).not.toMatch(/Grouped by what exists today/i);
    expect(text).not.toMatch(/maturity picture in one pass/i);
    expect(text).not.toMatch(/Available for diligence today/i);
    expect(text).not.toMatch(/At a glance/i);
  });

  it("does not render duplicate summary or evidence-group sections", () => {
    render(<MarketingSecurityTrustView />);

    expect(screen.queryByTestId("security-trust-summary-row")).not.toBeInTheDocument();
    expect(screen.queryByTestId("security-trust-evidence-group-public")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "What you can review today" })).not.toBeInTheDocument();
  });

  it("surfaces maturity and access status tags on engagement cards", () => {
    render(<MarketingSecurityTrustView />);

    const penTest = screen.getByTestId("assurance-row-pen-test-third-party-planned");
    expect(within(penTest).getByTestId("assurance-maturity-badge")).toHaveTextContent("Planned");
    expect(within(penTest).getByTestId("assurance-access-badge")).toHaveTextContent("Planned");

    const soc2 = screen.getByTestId("assurance-row-owner-security-self-assessment-2026");
    expect(within(soc2).getByTestId("assurance-maturity-badge")).toHaveTextContent("Available now");
    expect(within(soc2).getByTestId("assurance-access-badge")).toHaveTextContent("Public");
  });

  it("labels engagement timing as review cadence", () => {
    render(<MarketingSecurityTrustView />);

    expect(screen.getAllByText(/Review cadence:/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Next milestone:/i)).not.toBeInTheDocument();
  });

  it("renders hero actions and primary diligence CTAs", () => {
    render(<MarketingSecurityTrustView />);

    expect(screen.getByTestId("security-trust-page-purpose")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open Trust Center downloads/i })).toHaveAttribute(
      "href",
      "/trust#trust-public-downloads",
    );

    const heroCtas = screen.getByTestId("security-trust-hero-ctas");
    expect(within(heroCtas).getByRole("link", { name: /View public evidence/i })).toHaveAttribute("href", "/trust");
    expect(within(heroCtas).getByRole("link", { name: /Request diligence materials/i })).toHaveAttribute(
      "href",
      "/trust#trust-contact-review",
    );
    expect(within(heroCtas).getByRole("link", { name: /Contact security/i })).toHaveAttribute(
      "href",
      "mailto:security@archlucid.net",
    );
  });

  it("renders demoted vocabulary disclosure and revision history", () => {
    render(<MarketingSecurityTrustView />);

    expect(screen.getByTestId("assurance-status-vocabulary-disclosure")).toBeInTheDocument();
    expect(screen.getByTestId("trust-center-revision-history")).toBeInTheDocument();
  });

  it("uses semantic heading order", () => {
    render(<MarketingSecurityTrustView />);

    const headings = screen.getAllByRole("heading").map((node) => node.tagName);
    expect(headings[0]).toBe("H1");
  });

  it("renders desktop assurance grids by maturity tier", () => {
    render(<MarketingSecurityTrustView />);

    expect(screen.getByTestId("security-trust-assurance-grid-available_now")).toHaveClass("lg:grid-cols-2");
  });

  it("does not render a duplicate marketing navigation header", () => {
    render(<MarketingSecurityTrustView />);

    expect(screen.queryByRole("navigation", { name: "Marketing" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/ArchLucid — welcome/i)).not.toBeInTheDocument();
  });
});

describe("MarketingSecurityTrustPage chrome", () => {
  it("renders exactly one public header when composed with marketing layout chrome", () => {
    render(
      <>
        <header data-testid="marketing-public-header">Public nav</header>
        <MarketingSecurityTrustView />
      </>,
    );

    expect(screen.getAllByTestId("marketing-public-header")).toHaveLength(1);
    expect(screen.queryByRole("navigation", { name: "Marketing" })).not.toBeInTheDocument();
  });
});
