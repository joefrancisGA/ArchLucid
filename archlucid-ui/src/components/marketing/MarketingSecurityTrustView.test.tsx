import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingSecurityTrustView } from "./MarketingSecurityTrustView";
import { securityTrustEngagementRows } from "@/lib/security-trust-content";

describe("MarketingSecurityTrustView", () => {
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

  it("surfaces the NDA notice and points reviewers at security@archlucid.net", () => {
    render(<MarketingSecurityTrustView />);

    expect(screen.getAllByText(/under NDA/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/security@archlucid\.net/i).length).toBeGreaterThan(0);
  });

  it("describes staging resilience without internal backlog references", () => {
    render(<MarketingSecurityTrustView />);

    const chaosRow = screen.getByTestId("assurance-row-chaos-game-day-quarterly-staging-2026");
    expect(within(chaosRow).getByText(/Staging-only fault-injection/i)).toBeInTheDocument();
  });

  it("surfaces maturity status and availability copy (details, not badge-only labels)", () => {
    render(<MarketingSecurityTrustView />);

    const penTest = screen.getByTestId("assurance-row-pen-test-third-party-planned");
    expect(within(penTest).getByTestId("assurance-maturity-badge")).toHaveTextContent("Planned");
    expect(within(penTest).getByTestId("assurance-access-badge")).toHaveTextContent(
      /Redacted summary|security@archlucid/i,
    );

    const soc2 = screen.getByTestId("assurance-row-owner-security-self-assessment-2026");
    expect(within(soc2).getByTestId("assurance-maturity-badge")).toHaveTextContent("Available now");
    expect(within(soc2).getByTestId("assurance-access-badge")).toHaveTextContent(/readiness summary|SOC/i);
  });
});
