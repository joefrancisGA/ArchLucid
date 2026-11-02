import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowInvestigationEffortPageView } from "./SecureNowInvestigationEffortPageView";

describe("SecureNowInvestigationEffortPageView", () => {
  it("renders the four ROI notes", () => {
    render(<SecureNowInvestigationEffortPageView />);

    expect(
      screen.getByTestId("securenow-investigation-effort-page"),
    ).toBeInTheDocument();
    expect(screen.getByText(/NO_GO/)).toBeInTheDocument();
    expect(screen.getByText(/This page is not a savings claim\./)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Pilot measurement log" }),
    ).toHaveAttribute(
      "href",
      "https://github.com/joefrancisGA/ArchLucid/blob/master/docs/securenow/PILOT_MEASUREMENT_LOG.md",
    );
    expect(screen.getByRole("link", { name: "Cost input" })).toHaveAttribute(
      "href",
      "https://github.com/joefrancisGA/ArchLucid/blob/master/docs/securenow/ROI_COST_INPUT.md",
    );
    expect(
      screen.getByRole("link", { name: "Fixture worksheet" }),
    ).toHaveAttribute(
      "href",
      "https://github.com/joefrancisGA/ArchLucid/blob/master/docs/securenow/ROI_FIXTURE_WORKSHEET.md",
    );
    expect(screen.getByRole("link", { name: "Send rule" })).toHaveAttribute(
      "href",
      "https://github.com/joefrancisGA/ArchLucid/blob/master/docs/securenow/ROI_SEND_RULE.md",
    );
    expect(
      screen.getByTestId("securenow-investigation-effort-page"),
    ).not.toHaveTextContent(/\$/);
  });
});
