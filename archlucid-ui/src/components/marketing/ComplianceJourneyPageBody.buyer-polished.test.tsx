import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ComplianceJourneyPageBody } from "@/components/marketing/ComplianceJourneyPageBody";
import {
  COMPLIANCE_JOURNEY_CLAIM_DISCIPLINE,
  COMPLIANCE_JOURNEY_FOLLOW_UPS_TITLE,
  COMPLIANCE_JOURNEY_SOURCES,
} from "@/lib/compliance-journey-evidence-copy";
import {
  COMPLIANCE_JOURNEY_FIRST_VIEWPORT_ID,
  COMPLIANCE_JOURNEY_PRIMARY_CONTENT_ID,
  COMPLIANCE_JOURNEY_SKIP_LINK_LABEL,
  COMPLIANCE_JOURNEY_SKIP_TARGET_ID,
} from "@/lib/compliance-journey-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

describe("ComplianceJourneyPageBody buyer-polished shell", () => {
  it("renders skip link, orientation above journey stages, and Sources links", () => {
    render(<ComplianceJourneyPageBody />);

    expect(screen.getByRole("link", { name: COMPLIANCE_JOURNEY_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${COMPLIANCE_JOURNEY_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("compliance-journey-primary-content")).toHaveAttribute(
      "id",
      COMPLIANCE_JOURNEY_PRIMARY_CONTENT_ID,
    );
    expect(screen.queryByTestId("compliance-journey-breadcrumb")).not.toBeInTheDocument();

    const primaryContent = screen.getByTestId("compliance-journey-primary-content");
    const hero = screen.getByTestId("compliance-journey-hero");
    const firstViewport = screen.getByTestId(COMPLIANCE_JOURNEY_FIRST_VIEWPORT_ID);
    const orientationTop = screen.getByTestId("compliance-journey-orientation-top");
    const stages = screen.getByTestId("compliance-journey-stages");
    const sourcesSection = screen.getByTestId("compliance-journey-sources");

    expect(primaryContent).toContainElement(hero);
    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).not.toContainElement(hero);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(stages);
    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(stages) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(within(orientationTop).getByTestId("compliance-journey-claim-discipline").textContent).toContain(
      COMPLIANCE_JOURNEY_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { level: 2, name: COMPLIANCE_JOURNEY_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getAllByTestId("compliance-journey-sources")).toHaveLength(1);

    for (const source of filterWhereToGoNextFollowUpLinks(COMPLIANCE_JOURNEY_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
