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
