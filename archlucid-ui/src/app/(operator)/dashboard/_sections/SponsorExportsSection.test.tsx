import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

import { SponsorExportsSection } from "./SponsorExportsSection";

describe("SponsorExportsSection", () => {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  it("renders sponsor export action rows with methodology always available when empty", () => {
    render(<SponsorExportsSection hasCommittedReviews={false} />);

    expect(screen.getByTestId("sponsor-exports-scorecard")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-exports-pilot-value")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-exports-roi-methodology")).toBeInTheDocument();
    expect(screen.getAllByText(v.sponsorExportsUnavailableFootnote)).toHaveLength(2);
    expect(screen.queryByTestId("sponsor-exports-scorecard-action")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sponsor-exports-pilot-value-action")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: v.sponsorExportsRoiAction })).toHaveAttribute("href", "/value-report/roi");
  });

  it("enables scorecard and pilot value actions when committed reviews exist", () => {
    render(<SponsorExportsSection hasCommittedReviews />);

    expect(screen.getByRole("link", { name: v.sponsorExportsScorecardAction })).toHaveAttribute(
      "href",
      "/executive/scorecard",
    );
    expect(screen.getByRole("link", { name: v.sponsorExportsPilotValueAction })).toHaveAttribute(
      "href",
      "/value-report/pilot",
    );
    expect(screen.queryByText(v.sponsorExportsUnavailableFootnote)).not.toBeInTheDocument();
  });
});
