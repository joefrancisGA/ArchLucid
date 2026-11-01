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
    expect(
      screen.getByRole("link", { name: "Pilot measurement log" }),
    ).toHaveAttribute("href", "docs/securenow/PILOT_MEASUREMENT_LOG.md");
    expect(screen.getByRole("link", { name: "Cost input" })).toHaveAttribute(
      "href",
      "docs/securenow/ROI_COST_INPUT.md",
    );
    expect(
      screen.getByRole("link", { name: "Fixture worksheet" }),
    ).toHaveAttribute("href", "docs/securenow/ROI_FIXTURE_WORKSHEET.md");
    expect(screen.getByRole("link", { name: "Send rule" })).toHaveAttribute(
      "href",
      "docs/securenow/ROI_SEND_RULE.md",
    );
    expect(
      screen.getByTestId("securenow-investigation-effort-page"),
    ).not.toHaveTextContent(/\$/);
  });
});
