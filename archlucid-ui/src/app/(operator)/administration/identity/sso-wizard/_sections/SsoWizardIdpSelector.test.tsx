import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SsoWizardIdpSelector } from "./SsoWizardIdpSelector";

describe("SsoWizardIdpSelector", () => {
  it("renders an accessible identity-provider radio group with buyer labels", () => {
    const onChange = vi.fn();

    render(<SsoWizardIdpSelector value={null} onChange={onChange} />);

    expect(screen.getByRole("radiogroup", { name: /identity provider/i })).toBeInTheDocument();
    expect(screen.getByTestId("sso-idp-entra")).toHaveTextContent("Microsoft Entra ID");
    expect(screen.getByTestId("sso-idp-okta")).toHaveTextContent("Okta");
    expect(screen.getByTestId("sso-idp-auth0")).toHaveTextContent("Auth0");
    expect(screen.getByTestId("sso-idp-other")).toHaveTextContent("Other");
    expect(screen.getByTestId("sso-idp-selector").textContent ?? "").not.toMatch(/IdP entity/i);
  });

  it("shows one circular selection control per card adjacent to the label", () => {
    render(<SsoWizardIdpSelector value="okta" onChange={vi.fn()} />);

    for (const id of ["entra", "okta", "auth0", "other"]) {
      const card = screen.getByTestId(`sso-idp-${id}`);
      const circles = card.querySelectorAll(".rounded-full.border-2");

      expect(circles.length).toBe(1);
    }
  });

  it("notifies onChange when a provider card is selected", () => {
    const onChange = vi.fn();

    render(<SsoWizardIdpSelector value={null} onChange={onChange} />);

    fireEvent.click(screen.getByTestId("sso-idp-entra"));
    expect(onChange).toHaveBeenCalledWith("entra");
  });

  it("marks the selected provider", () => {
    render(<SsoWizardIdpSelector value="okta" onChange={vi.fn()} />);

    expect(screen.getByRole("radio", { name: "Okta" })).toBeChecked();
  });
});
