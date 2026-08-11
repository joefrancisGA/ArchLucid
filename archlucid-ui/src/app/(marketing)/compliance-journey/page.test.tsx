import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ComplianceJourneyPage from "@/app/(marketing)/compliance-journey/page";
import {
  COMPLIANCE_JOURNEY_PRIMARY_TRUST_CENTER_CTA_LABEL,
  COMPLIANCE_JOURNEY_STAGES,
  COMPLIANCE_JOURNEY_VERIFY_CONFIRMATION,
} from "@/lib/compliance-journey-page-copy";
import { COMPLIANCE_JOURNEY_TRUST_PUBLIC_DOWNLOADS_HREF } from "@/lib/compliance-journey-diligence-links";

describe("ComplianceJourneyPage (TB-1483, TB-1485, TB-1487)", () => {
  it("uses MarketingPageShell and staged journey sections with one primary Trust Center CTA", () => {
    render(<ComplianceJourneyPage />);

    expect(screen.getByTestId("compliance-journey-page")).toBeInTheDocument();
    expect(screen.getByTestId("compliance-journey-body")).toBeInTheDocument();

    for (const stage of COMPLIANCE_JOURNEY_STAGES) {
      expect(screen.getByTestId(`compliance-journey-stage-${stage.id}`)).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: stage.title })).toBeInTheDocument();
    }

    const primaryCtas = screen.getAllByTestId("compliance-journey-primary-trust-center-cta");

    expect(primaryCtas).toHaveLength(1);
    expect(primaryCtas[0]).toHaveAttribute("href", "/trust");
    expect(primaryCtas[0]).toHaveTextContent(COMPLIANCE_JOURNEY_PRIMARY_TRUST_CENTER_CTA_LABEL);

    expect(screen.getByTestId("compliance-journey-verify-confirmation")).toHaveTextContent(
      COMPLIANCE_JOURNEY_VERIFY_CONFIRMATION,
    );

    expect(screen.queryByTestId("compliance-journey-link-trust-center")).not.toBeInTheDocument();
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
