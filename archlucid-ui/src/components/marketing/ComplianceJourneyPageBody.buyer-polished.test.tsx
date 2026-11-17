import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    usePathname: () => "/compliance-journey",
    useSearchParams: () => new URLSearchParams(),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  };
});

import { ComplianceJourneyPageBody } from "@/components/marketing/ComplianceJourneyPageBody";
import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";
import {
  COMPLIANCE_JOURNEY_CANONICAL_PATH,
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

    expectWhereToGoNextFollowUpLinks(within(sourcesSection), COMPLIANCE_JOURNEY_SOURCES, COMPLIANCE_JOURNEY_CANONICAL_PATH);
  });
});
