import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trust-center-marketing", () => ({
  parseTrustCenterLastReviewedUtc: () => "2026-08-15T12:00:00.000Z",
  readTrustCenterMarkdown: () => "# Trust center",
}));

import MarketingAssuranceStatusPage from "@/app/(marketing)/assurance-status/page";
import { ASSURANCE_STATUS_SKIP_LINK_LABEL } from "@/lib/marketing/assurance-status-page-copy";

describe("MarketingAssuranceStatusPage buyer-polished shell (SEC)", () => {
  it("renders assurance status marketing chrome", async () => {
    const page = await MarketingAssuranceStatusPage();

    render(page);

    expect(screen.getByRole("link", { name: ASSURANCE_STATUS_SKIP_LINK_LABEL })).toBeInTheDocument();
    expect(screen.getByTestId("assurance-status-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("assurance-status-orientation-top")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Assurance status" })).toBeInTheDocument();
  });
});
