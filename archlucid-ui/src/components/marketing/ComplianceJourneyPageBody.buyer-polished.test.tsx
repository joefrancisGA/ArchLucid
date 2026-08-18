import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ComplianceJourneyPageBody } from "@/components/marketing/ComplianceJourneyPageBody";
import {
  COMPLIANCE_JOURNEY_CLAIM_DISCIPLINE_HEADING,
  COMPLIANCE_JOURNEY_FOLLOW_UPS_TITLE,
} from "@/lib/compliance-journey-evidence-copy";
import {
  COMPLIANCE_JOURNEY_PRIMARY_CONTENT_ID,
  COMPLIANCE_JOURNEY_SKIP_LINK_LABEL,
} from "@/lib/compliance-journey-page-copy";

describe("ComplianceJourneyPageBody buyer-polished shell", () => {
  it("renders skip link, breadcrumb, and orientation above primary journey content", () => {
    render(<ComplianceJourneyPageBody />);

    expect(screen.getByRole("link", { name: COMPLIANCE_JOURNEY_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${COMPLIANCE_JOURNEY_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("compliance-journey-breadcrumb")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: COMPLIANCE_JOURNEY_CLAIM_DISCIPLINE_HEADING }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: COMPLIANCE_JOURNEY_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const orientation = screen.getByTestId("compliance-journey-orientation-top");
    const stages = screen.getByTestId("compliance-journey-stages");

    expect(screen.getByTestId("compliance-journey-primary-content")).toContainElement(stages);
    expect(orientation.compareDocumentPosition(stages) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    expect(screen.getAllByTestId("compliance-journey-sources")).toHaveLength(1);
  });
});
