import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowPilotDecisionPageView } from "./SecureNowPilotDecisionPageView";

describe("SecureNow pilot decision preparation page", () => {
  it("renders the human close path and all three outcomes", () => {
    render(<SecureNowPilotDecisionPageView />);

    expect(screen.getByTestId("securenow-pilot-decision-page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pilot decision preparation" })).toBeInTheDocument();
    expect(screen.getByText(/Confirm the sponsor/)).toBeInTheDocument();
    expect(screen.getByText(/Proceed to commercial discussion is a human decision/)).toBeInTheDocument();
    expect(screen.getByText(/Extend with bounded scope names/)).toBeInTheDocument();
    expect(screen.getByText(/Stop preserves the evidence/)).toBeInTheDocument();
    expect(screen.getByTestId("securenow-decision-cycle")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Qualify" })).toHaveAttribute(
      "href",
      "/administration/securenow-first-hour",
    );
    expect(screen.getByRole("link", { name: "Scope" })).toHaveAttribute(
      "href",
      "/integrations/cloud-connections",
    );
    expect(screen.getByRole("link", { name: "Review" })).toHaveAttribute(
      "href",
      "/security/remediation-factory",
    );
    expect(screen.getByRole("link", { name: "Decide change" })).toHaveAttribute(
      "href",
      "/administration/securenow-pilot-decision#securenow-pilot-decision-outcomes-heading",
    );
    expect(screen.getByRole("link", { name: "Verify" })).toHaveAttribute(
      "href",
      "/security/remediation-instances",
    );
    expect(screen.getByRole("link", { name: "Close" })).toHaveAttribute(
      "href",
      "https://github.com/joefrancisGA/ArchLucid/blob/master/docs/securenow/DECISION_CYCLE_LOG.md",
    );
    expect(screen.getByRole("link", { name: "Decision cycle log" })).toHaveAttribute(
      "href",
      "https://github.com/joefrancisGA/ArchLucid/blob/master/docs/securenow/DECISION_CYCLE_LOG.md",
    );
    expect(screen.getByRole("link", { name: "Read the sponsor-facing decision path" })).toHaveAttribute(
      "href",
      "/why-securenow#pilot-decision",
    );
  });

  it("keeps billing, beta and ROI claims out of the preparation page", () => {
    const { container } = render(<SecureNowPilotDecisionPageView />);
    const text = container.textContent ?? "";

    expect(text).toMatch(/NO_GO/);
    expect(text).not.toMatch(/\$/);
    expect(text).not.toMatch(/calculates ROI/i);
    expect(text).not.toMatch(/guaranteed savings/i);
    expect(text).not.toMatch(/SOC 2 certified/i);
  });
});
