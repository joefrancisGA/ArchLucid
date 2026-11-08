import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SPONSOR_REPORT_PAGE_TITLE } from "@/lib/buyer/buyer-polish-copy";

import { SponsorReportBreadcrumb } from "./SponsorReportBreadcrumb";

describe("SponsorReportBreadcrumb", () => {
  it("defers to page titles after TB-2090 breadcrumb removal", () => {
    render(<SponsorReportBreadcrumb />);

    expect(screen.queryByTestId("sponsor-report-breadcrumb")).not.toBeInTheDocument();
    expect(SPONSOR_REPORT_PAGE_TITLE.length).toBeGreaterThan(0);
  });
});
