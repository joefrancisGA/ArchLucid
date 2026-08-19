import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SPONSOR_REPORT_PAGE_TITLE } from "@/lib/buyer/buyer-polish-copy";

import { SponsorReportBreadcrumb } from "./SponsorReportBreadcrumb";

describe("SponsorReportBreadcrumb", () => {
  it("renders insights trail ending on Sponsor report", () => {
    render(<SponsorReportBreadcrumb />);

    expect(screen.getByTestId("sponsor-report-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Insights" })).toHaveAttribute("href", "/insights/evidence-graph");
    expect(screen.getByText(SPONSOR_REPORT_PAGE_TITLE)).toBeInTheDocument();
  });
});
