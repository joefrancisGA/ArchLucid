import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (init: RequestInit) => init,
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

import { SsoWizardPageClient } from "./_sections/SsoWizardPageClient";

describe("SsoWizardPage", () => {
  it("renders protocol step with OIDC and SAML choices", () => {
    render(<SsoWizardPageClient />);

    expect(screen.getByRole("heading", { name: /SSO configuration wizard/i })).toBeInTheDocument();
    expect(screen.getByTestId("sso-protocol-oidc")).toBeInTheDocument();
    expect(screen.getByTestId("sso-protocol-saml")).toBeInTheDocument();
  });
});
