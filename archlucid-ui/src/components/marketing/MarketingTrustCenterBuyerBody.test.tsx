import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { MarketingTrustCenterBuyerBody } from "./MarketingTrustCenterBuyerBody";
import { TRUST_ASSURANCE_CLASSIFICATIONS } from "@/lib/trust-center-buyer-content";
import { TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF } from "@/lib/trust-center-public-assurance";

describe("MarketingTrustCenterBuyerBody", () => {
  it("renders hero hierarchy with one primary diligence action and secondary links", () => {
    render(<MarketingTrustCenterBuyerBody lastReviewedUtc="2026-05-01" />);

    expect(screen.getByRole("heading", { level: 1, name: "Trust Center" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Review ArchLucid’s current security posture, public assurance materials, and enterprise diligence process.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("trust-center-page-purpose")).toBeInTheDocument();

    const primaryActions = screen.getAllByRole("link", { name: /Request diligence materials/i });
    expect(primaryActions[0]).toHaveAttribute("href", "mailto:security@archlucid.net");
    expect(screen.getByTestId("trust-center-primary-action")).toBe(primaryActions[0]);

    const secondary = screen.getByTestId("trust-center-secondary-links");
    expect(within(secondary).getByRole("link", { name: /View public evidence/i })).toHaveAttribute(
      "href",
      "#trust-public-evidence",
    );
    expect(within(secondary).getByRole("link", { name: /Contact security/i })).toHaveAttribute(
      "href",
      "#trust-contact-review",
    );
    expect(within(secondary).getByRole("link", { name: /Privacy policy/i })).toHaveAttribute("href", "/privacy");
    expect(within(secondary).getByRole("link", { name: /Assurance status/i })).toHaveAttribute(
      "href",
      "/assurance-status",
    );
  });

  it("renders three assurance glance panels with classification labels", () => {
    render(<MarketingTrustCenterBuyerBody lastReviewedUtc="2026-05-01" />);

    expect(screen.getByTestId("trust-center-assurance-grid").className).toMatch(/lg:grid-cols-3/);
    expect(screen.getByTestId("trust-glance-panel-available-now")).toBeInTheDocument();
    expect(screen.getByTestId("trust-glance-panel-shared-diligence")).toBeInTheDocument();
    expect(screen.getByTestId("trust-glance-panel-planned")).toBeInTheDocument();
    expect(screen.getAllByText(TRUST_ASSURANCE_CLASSIFICATIONS.public).length).toBeGreaterThan(0);
    expect(screen.getAllByText(TRUST_ASSURANCE_CLASSIFICATIONS.nda).length).toBeGreaterThan(0);
    expect(screen.getAllByText(TRUST_ASSURANCE_CLASSIFICATIONS.planned).length).toBeGreaterThan(0);
  });

  it("renders a two-column trust content grid with availability labels", () => {
    render(<MarketingTrustCenterBuyerBody lastReviewedUtc="2026-05-01" />);

    const grid = screen.getByTestId("trust-center-content-grid");
    expect(grid.querySelector(".md\\:grid-cols-2")).not.toBeNull();
    expect(screen.getByTestId("trust-content-card-security-posture")).toBeInTheDocument();
    expect(screen.getByTestId("trust-content-card-assurance-artifacts")).toBeInTheDocument();
    expect(screen.getByTestId("trust-content-card-data-handling")).toBeInTheDocument();
    expect(screen.getByTestId("trust-content-card-procurement-package")).toBeInTheDocument();
    expect(screen.getAllByText(TRUST_ASSURANCE_CLASSIFICATIONS["on-request"]).length).toBeGreaterThan(0);
  });

  it("renders planned assurance milestones and structured public evidence metadata", () => {
    render(<MarketingTrustCenterBuyerBody lastReviewedUtc="2026-05-01" />);

    const planned = screen.getByTestId("trust-center-planned-assurance");
    expect(within(planned).getByRole("columnheader", { name: "Activity" })).toBeInTheDocument();
    expect(within(planned).getByText("SOC 2 readiness and control mapping")).toBeInTheDocument();

    expect(screen.getByTestId("trust-center-public-evidence")).toBeInTheDocument();
    expect(screen.getByTestId("trust-evidence-version")).toHaveTextContent("2026.05");
    expect(screen.getByTestId("trust-evidence-reviewed")).toHaveTextContent("2026-05-01");
    expect(screen.getByTestId("trust-center-evidence-request-link")).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:security@archlucid.net"),
    );
  });

  it("renders public assurance downloads without authentication gates", () => {
    render(<MarketingTrustCenterBuyerBody lastReviewedUtc="2026-05-01" />);

    const downloads = screen.getByTestId("trust-center-public-downloads");
    expect(within(downloads).queryByTestId("trust-public-artifact-link-evidence-pack-zip")).toBeNull();
    expect(within(downloads).getByTestId("trust-public-artifact-link-soc2-self-assessment")).toHaveAttribute(
      "href",
      "/help/soc2-self-assessment",
    );
    expect(within(downloads).getByTestId("trust-public-artifact-link-caiq-lite")).toHaveAttribute(
      "href",
      "/help/caiq-sig-response",
    );
    expect(within(downloads).getByTestId("trust-public-artifact-link-owner-pentest-summary")).toHaveAttribute(
      "href",
      "/help/procurement",
    );
    expect(screen.getByTestId("trust-center-evidence-pack-link")).toHaveAttribute(
      "href",
      TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF,
    );
  });

  it("cross-links tenant isolation, subprocessors, getting-started, and audit trail help topics", () => {
    render(<MarketingTrustCenterBuyerBody lastReviewedUtc="2026-05-01" />);

    const related = screen.getByTestId("trust-center-related-help");
    expect(within(related).getByTestId("trust-related-help-tenant-isolation")).toHaveAttribute(
      "href",
      "/help/data-handling",
    );
    expect(within(related).getByTestId("trust-related-help-subprocessors")).toHaveAttribute("href", "/help/subprocessors");
    expect(within(related).getByTestId("trust-related-help-caiq-sig-response")).toHaveAttribute(
      "href",
      "/help/caiq-sig-response",
    );
    expect(within(related).getByTestId("trust-related-help-getting-started")).toHaveAttribute(
      "href",
      "/help/getting-started#how-archlucid-works",
    );
    expect(within(related).getByTestId("trust-related-help-audit-trail")).toHaveAttribute("href", "/help/audit-trail");
  });

  it("consolidates security contact at the bottom", () => {
    render(<MarketingTrustCenterBuyerBody lastReviewedUtc="2026-05-01" />);

    const contact = screen.getByTestId("trust-center-security-contact");
    expect(within(contact).getByRole("heading", { level: 2, name: "Security and diligence contact" })).toBeInTheDocument();
    expect(within(contact).getByRole("link", { name: "security@archlucid.net" })).toBeInTheDocument();
  });
});

describe("MarketingPageShell trust variant", () => {
  it("uses the wide centered trust container", () => {
    render(
      <MarketingPageShell variant="trust" data-testid="trust-center-page">
        <div>Trust</div>
      </MarketingPageShell>,
    );

    const main = screen.getByTestId("trust-center-page");
    expect(main.className).toMatch(/max-w-6xl/);
    expect(main.className).toMatch(/mx-auto/);
  });
});
