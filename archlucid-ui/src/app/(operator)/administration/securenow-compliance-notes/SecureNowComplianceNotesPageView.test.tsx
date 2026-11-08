import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SECURENOW_COMPLIANCE_NOTES_LINKS } from "@/lib/product-line/securenow-compliance-notes-copy";

import { SecureNowComplianceNotesPageView } from "./SecureNowComplianceNotesPageView";

describe("SecureNowComplianceNotesPageView", () => {
  it("renders bounded duty and coverage notes", () => {
    render(<SecureNowComplianceNotesPageView />);

    expect(screen.getByTestId("securenow-compliance-notes-page")).toBeInTheDocument();
    expect(screen.getByText(/Not a certification/)).toBeInTheDocument();
    expect(screen.getByText(/NO_GO/)).toBeInTheDocument();
    expect(screen.getByText("Assurance opinion")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: SECURENOW_COMPLIANCE_NOTES_LINKS[0].label })).toHaveAttribute(
      "href",
      SECURENOW_COMPLIANCE_NOTES_LINKS[0].href,
    );
    expect(screen.getByRole("link", { name: SECURENOW_COMPLIANCE_NOTES_LINKS[1].label })).toHaveAttribute(
      "href",
      SECURENOW_COMPLIANCE_NOTES_LINKS[1].href,
    );
    expect(screen.getByTestId("securenow-compliance-expectation-keys-lead")).toHaveTextContent("WK-21");
    expect(screen.getByTestId("securenow-compliance-named-expectation-keys")).toBeInTheDocument();
  });
});
