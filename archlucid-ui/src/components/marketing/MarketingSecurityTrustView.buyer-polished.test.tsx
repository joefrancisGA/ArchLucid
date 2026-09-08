import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/product-line/resolve-product-line-id", () => ({
  resolveProductLineIdFromEnv: () => "architecture",
}));

import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { MarketingSecurityTrustView } from "@/components/marketing/MarketingSecurityTrustView";
import {
  ASSURANCE_STATUS_FIRST_VIEWPORT_ID,
  ASSURANCE_STATUS_HERO_SUPPORTING,
  ASSURANCE_STATUS_PRIMARY_CONTENT_ID,
  ASSURANCE_STATUS_SKIP_LINK_LABEL,
  ASSURANCE_STATUS_SKIP_TARGET_ID,
} from "@/lib/marketing/assurance-status-page-copy";
import { securityTrustEvidenceSources } from "@/lib/security-trust-product-copy";

describe("MarketingSecurityTrustView buyer-polished shell (SEC)", () => {
  it("renders skip link, orientation above workspace, buyer hero lead, and Sources links", () => {
    render(<MarketingSecurityTrustView lastReviewedUtc="2026-08-15T12:00:00.000Z" />);

    expect(screen.getByRole("link", { name: ASSURANCE_STATUS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ASSURANCE_STATUS_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("assurance-status-primary-content")).toHaveAttribute(
      "id",
      ASSURANCE_STATUS_PRIMARY_CONTENT_ID,
    );
    expect(screen.queryByTestId("assurance-status-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByText(ASSURANCE_STATUS_HERO_SUPPORTING)).toBeInTheDocument();
    expect(screen.queryByText(/SecureNow's current assurance posture/i)).not.toBeInTheDocument();

    const primaryContent = screen.getByTestId("assurance-status-primary-content");
    const hero = screen.getByTestId("assurance-status-hero");
    const firstViewport = screen.getByTestId(ASSURANCE_STATUS_FIRST_VIEWPORT_ID);
    const orientationTop = screen.getByTestId("assurance-status-orientation-top");
    const vocabularyDisclosure = screen.getByTestId("assurance-status-vocabulary-disclosure");
    const sourcesSection = screen.getByTestId("assurance-status-sources");

    expect(primaryContent).toContainElement(hero);
    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).not.toContainElement(hero);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(vocabularyDisclosure);
    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(vocabularyDisclosure) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const source of filterWhereToGoNextFollowUpLinks(securityTrustEvidenceSources("architecture"))) {
      expect(within(sourcesSection).getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }
  });
});
