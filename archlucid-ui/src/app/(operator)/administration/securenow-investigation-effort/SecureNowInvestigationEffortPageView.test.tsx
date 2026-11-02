import { fireEvent, render, screen } from "@testing-library/react";
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

  it("keeps incomplete and fixture inputs out of the ROI result", () => {
    render(<SecureNowInvestigationEffortPageView />);

    expect(screen.getByTestId("securenow-investigation-effort-result")).toHaveTextContent(
      "ROI not calculated.",
    );

    fireEvent.change(screen.getByLabelText("Baseline hours (B)"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("After-product hours (A)"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Annual investigations (N)"), { target: { value: "20" } });
    fireEvent.change(screen.getByLabelText("Fully loaded hourly rate (R)"), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("Annual product and operating cost (C)"), { target: { value: "10000" } });

    expect(screen.getByTestId("securenow-investigation-effort-result")).toHaveTextContent(
      "Those values are the fixture worksheet.",
    );
  });
});
