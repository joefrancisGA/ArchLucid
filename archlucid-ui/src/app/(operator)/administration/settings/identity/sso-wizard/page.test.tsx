import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (init: RequestInit) => init,
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

import { SsoWizardPageClient } from "./_sections/SsoWizardPageClient";
import { SSO_WIZARD_BANNED_UI_PATTERNS } from "@/lib/sso-wizard-copy";

describe("SsoWizardPage", () => {
  it("renders enterprise SSO wizard chrome without internal implementation language", () => {
    render(<SsoWizardPageClient />);

    expect(screen.getByRole("heading", { name: /Configure single sign-on/i })).toBeInTheDocument();
    expect(screen.getByText(/test the connection before it can be activated/i)).toBeInTheDocument();
    expect(screen.getByTestId("sso-wizard-stepper")).toBeInTheDocument();
    expect(screen.getByTestId("sso-protocol-selector")).toBeInTheDocument();
    expect(screen.getByTestId("sso-wizard-continue")).toBeDisabled();

    const pageText = screen.getByTestId("sso-wizard-page").textContent ?? "";

    for (const pattern of SSO_WIZARD_BANNED_UI_PATTERNS) {
      expect(pageText, `expected no match for ${pattern}`).not.toMatch(pattern);
    }
  });

  it("exposes an accessible protocol radio group with Continue gating", () => {
    render(<SsoWizardPageClient />);

    const radioGroup = screen.getByRole("radiogroup", { name: /single sign-on protocol/i });
    expect(radioGroup).toBeInTheDocument();

    const continueButton = screen.getByTestId("sso-wizard-continue");
    expect(continueButton).toBeDisabled();
    expect(screen.getByText(/Select OpenID Connect or SAML 2.0 to continue/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("sso-protocol-oidc"));
    expect(continueButton).toBeEnabled();

    fireEvent.click(continueButton);
    expect(screen.getByTestId("sso-metadata-url")).toBeInTheDocument();
  });

  it("provides cancel navigation back to identity providers", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<SsoWizardPageClient />);

    fireEvent.click(screen.getByTestId("sso-protocol-oidc"));
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/administration/settings/identity-providers");

    confirmSpy.mockRestore();
  });

  it("expands protocol guidance without implementation leakage", () => {
    render(<SsoWizardPageClient />);

    fireEvent.click(screen.getByText(/Not sure which protocol to choose/i));
    expect(screen.getByText(/Choose OpenID Connect when your provider supports it/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Enterprise onboarding checklist/i })).toHaveAttribute(
      "href",
      "/help/enterprise-onboarding",
    );
  });
});
