import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

import { SignupAccessRequestPanel } from "@/components/marketing/SignupAccessRequestPanel";
import {
  SIGNUP_INVITE_ONLY_PANEL_HEADING,
  SIGNUP_INVITE_ONLY_SECONDARY_CTA_LABEL,
  SIGNUP_INVITE_ONLY_SUBMIT_LABEL,
} from "@/lib/signup-invite-only-copy";

describe("SignupAccessRequestPanel", () => {
  it("shows work-email fields immediately with no Request access gate", () => {
    render(<SignupAccessRequestPanel />);

    expect(screen.getByTestId("signup-access-request-panel")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: SIGNUP_INVITE_ONLY_PANEL_HEADING })).toBeInTheDocument();
    expect(screen.getByTestId("signup-access-request-form")).toBeInTheDocument();
    expect(screen.getByLabelText(/Work email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: SIGNUP_INVITE_ONLY_SUBMIT_LABEL })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /^Request access$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: SIGNUP_INVITE_ONLY_SECONDARY_CTA_LABEL })).toHaveAttribute("href", "/see-it");

    const panelText = screen.getByTestId("signup-access-request-panel").textContent ?? "";

    expect(panelText.toLowerCase()).not.toMatch(/private beta/);
    expect(panelText.toLowerCase()).not.toMatch(/seat is available/);
  });

  it("does not repeat Product FAQ inside the access panel", () => {
    render(<SignupAccessRequestPanel />);

    expect(screen.queryByRole("link", { name: /Product FAQ/i })).not.toBeInTheDocument();
  });
});
