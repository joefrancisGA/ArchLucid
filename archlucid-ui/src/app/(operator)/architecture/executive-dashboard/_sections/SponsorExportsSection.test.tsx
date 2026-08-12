import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";
import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";

import { SponsorExportsSection } from "./SponsorExportsSection";

describe("SponsorExportsSection", () => {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  it("renders sponsor export output cards with preview actions when locked", () => {
    render(<SponsorExportsSection hasCommittedReviews={false} />);

    expect(screen.getByTestId("sponsor-exports-scorecard")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-exports-pilot-value")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-exports-roi-methodology")).toBeInTheDocument();
    expect(screen.getAllByText(v.sponsorExportsUnavailableFootnote)).toHaveLength(2);
    const previewLinks = screen.getAllByRole("link", { name: v.sponsorExportsPreviewSampleAction });

    expect(previewLinks).toHaveLength(2);
    expect(previewLinks[0]).toHaveAttribute("href", ARCHITECTURE_SCORECARD_PATH);
    expect(previewLinks[1]).toHaveAttribute("href", v.sponsorExportsPilotValueSampleHref);
    expect(screen.getByRole("link", { name: v.sponsorExportsRoiAction })).toHaveAttribute(
      "href",
      "/insights/roi-summary",
    );
    expect(screen.queryByTestId("sponsor-exports-scorecard-action")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sponsor-exports-pilot-value-action")).not.toBeInTheDocument();
  });

  it("enables scorecard and pilot value actions when committed reviews exist", () => {
    render(<SponsorExportsSection hasCommittedReviews />);

    expect(screen.getByRole("link", { name: v.sponsorExportsScorecardAction })).toHaveAttribute(
      "href",
      EXECUTIVE_DASHBOARD_HREF,
    );
    expect(screen.getByRole("link", { name: v.sponsorExportsPilotValueAction })).toHaveAttribute(
      "href",
      "/insights/pilot-outcomes",
    );
    expect(screen.queryByText(v.sponsorExportsUnavailableFootnote)).not.toBeInTheDocument();
  });
});
