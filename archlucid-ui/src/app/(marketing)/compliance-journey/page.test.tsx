import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ComplianceJourneyPage from "@/app/(marketing)/compliance-journey/page";
import {
  COMPLIANCE_JOURNEY_HERO_ORIENTATION,
  COMPLIANCE_JOURNEY_LAST_REVIEWED_LABEL,
  COMPLIANCE_JOURNEY_SKIP_LINK_LABEL,
  COMPLIANCE_JOURNEY_STAGES,
  COMPLIANCE_JOURNEY_VERIFY_CONFIRMATION,
} from "@/lib/compliance-journey-page-copy";
import { COMPLIANCE_JOURNEY_TRUST_PUBLIC_DOWNLOADS_HREF } from "@/lib/compliance-journey-diligence-links";

describe("ComplianceJourneyPage (TB-1483, TB-1485, TB-1487)", () => {
  it("uses MarketingPageShell and staged journey sections with one primary Trust Center CTA", () => {
    render(<ComplianceJourneyPage />);

    expect(screen.getByTestId("compliance-journey-page")).toBeInTheDocument();
    expect(screen.getByTestId("compliance-journey-body")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: COMPLIANCE_JOURNEY_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      "#compliance-journey-primary-content",
    );
    expect(screen.getByTestId("compliance-journey-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("compliance-journey-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("compliance-journey-primary-content")).toBeInTheDocument();
    expect(screen.getByTestId("compliance-journey-hero-meta")).toHaveTextContent(COMPLIANCE_JOURNEY_LAST_REVIEWED_LABEL);
    expect(screen.getByText(COMPLIANCE_JOURNEY_HERO_ORIENTATION)).toBeInTheDocument();
    expect(screen.getByTestId("compliance-journey-scope-disclosure")).toBeInTheDocument();
    expect(screen.getByTestId("trust-center-revision-history")).toBeInTheDocument();

    for (const stage of COMPLIANCE_JOURNEY_STAGES) {
      expect(screen.getByTestId(`compliance-journey-stage-${stage.id}`)).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: stage.title })).toBeInTheDocument();
    }

    const primaryCtas = screen.getAllByTestId("compliance-journey-primary-trust-center-cta");

    expect(primaryCtas).toHaveLength(1);
    expect(primaryCtas[0]).toHaveAttribute("href", "/trust");

    expect(screen.getByTestId("compliance-journey-verify-confirmation")).toHaveTextContent(
      COMPLIANCE_JOURNEY_VERIFY_CONFIRMATION,
    );

    const publishStage = screen.getByTestId("compliance-journey-stage-what-we-publish");

    expect(within(publishStage).queryByTestId("compliance-journey-link-trust-center")).not.toBeInTheDocument();
  });

  it("links Where we are today to Assurance status and Trust Center", () => {
    render(<ComplianceJourneyPage />);

    const whereStage = screen.getByTestId("compliance-journey-stage-where-we-are");

    expect(within(whereStage).getByRole("link", { name: /Assurance status \(Trust Center page\)/i })).toHaveAttribute(
      "href",
      "/assurance-status",
    );
    expect(within(whereStage).getByRole("link", { name: /Trust Center \(Trust Center page\)/i })).toHaveAttribute(
      "href",
      "/trust",
    );
  });

  it("keeps secondary diligence links under the publish and diligence stages", () => {
    render(<ComplianceJourneyPage />);

    const publishStage = screen.getByTestId("compliance-journey-stage-what-we-publish");
    const diligenceStage = screen.getByTestId("compliance-journey-stage-how-to-diligence");

    expect(
      within(publishStage).getByRole("link", {
        name: /Public assurance downloads \(Trust Center download\)/i,
      }),
    ).toHaveAttribute("href", COMPLIANCE_JOURNEY_TRUST_PUBLIC_DOWNLOADS_HREF);

    expect(
      within(diligenceStage).getByRole("link", {
        name: /DPA template \(template in product help\)/i,
      }),
    ).toHaveAttribute("href", "/help/dpa-template");
  });
});
