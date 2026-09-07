import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/product-line/resolve-product-line-id", () => ({
  resolveProductLineIdFromEnv: () => "architecture",
}));

import { MarketingSecurityTrustView } from "@/components/marketing/MarketingSecurityTrustView";
import {
  ASSURANCE_STATUS_HERO_SUPPORTING,
  ASSURANCE_STATUS_PRIMARY_CONTENT_ID,
  ASSURANCE_STATUS_SKIP_LINK_LABEL,
} from "@/lib/marketing/assurance-status-page-copy";

describe("MarketingSecurityTrustView buyer-polished shell (SEC)", () => {
  it("renders skip link, breadcrumb, orientation strip, and buyer hero lead", () => {
    render(<MarketingSecurityTrustView lastReviewedUtc="2026-08-15T12:00:00.000Z" />);

    expect(screen.getByRole("link", { name: ASSURANCE_STATUS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ASSURANCE_STATUS_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("assurance-status-primary-content")).toHaveAttribute(
      "id",
      ASSURANCE_STATUS_PRIMARY_CONTENT_ID,
    );
    expect(screen.queryByTestId("assurance-status-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("assurance-status-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("assurance-status-sources")).toBeInTheDocument();
    expect(screen.getByText(ASSURANCE_STATUS_HERO_SUPPORTING)).toBeInTheDocument();
    expect(screen.queryByText(/SecureNow's current assurance posture/i)).not.toBeInTheDocument();
  });
});
