import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SponsorExportsSection } from "./SponsorExportsSection";

describe("SponsorExportsSection", () => {
  it("renders sponsor export links on the dashboard", () => {
    render(<SponsorExportsSection />);

    expect(screen.getByRole("link", { name: "Executive scorecard" })).toHaveAttribute("href", "/executive/scorecard");
    expect(screen.getByRole("link", { name: "Pilot value report" })).toHaveAttribute("href", "/value-report/pilot");
    expect(screen.getByRole("link", { name: "ROI methodology help" })).toHaveAttribute("href", "/value-report/roi");
  });
});
