import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowComplianceNotesPageView } from "./SecureNowComplianceNotesPageView";

describe("SecureNowComplianceNotesPageView", () => {
  it("renders bounded duty and coverage notes", () => {
    render(<SecureNowComplianceNotesPageView />);

    expect(screen.getByTestId("securenow-compliance-notes-page")).toBeInTheDocument();
    expect(screen.getByText(/Not a certification/)).toBeInTheDocument();
    expect(screen.getByText(/NO_GO/)).toBeInTheDocument();
    expect(screen.getByText("Assurance opinion")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Control-evidence responsibility" })).toHaveAttribute(
      "href",
      "https://github.com/joefrancisGA/ArchLucid/blob/master/docs/securenow/CONTROL_EVIDENCE_RESPONSIBILITY.md",
    );
    expect(screen.getByRole("link", { name: "Framework coverage" })).toHaveAttribute(
      "href",
      "https://github.com/joefrancisGA/ArchLucid/blob/master/docs/securenow/FRAMEWORK_COVERAGE.md",
    );
    expect(screen.getByTestId("securenow-compliance-expectation-keys-lead")).toHaveTextContent("WK-21");
    expect(screen.getByTestId("securenow-compliance-named-expectation-keys")).toBeInTheDocument();
  });
});
