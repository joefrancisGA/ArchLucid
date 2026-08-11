import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: () => ({ push: pushMock }),
    usePathname: () => "/",
  };
});

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (init: RequestInit) => init,
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <button type="button">Page help</button>,
}));

import { SsoWizardPageClient } from "./_sections/SsoWizardPageClient";
import { SSO_WIZARD_BANNED_UI_PATTERNS } from "@/lib/sso-wizard-copy";
import { SSO_WIZARD_ACTIVATE_SUCCESS_MESSAGE } from "@/lib/admin-integration-mutation-outcome-copy";
import { showSuccess } from "@/lib/toast";

function selectEntraAndContinue(): void {
  fireEvent.click(screen.getByTestId("sso-idp-entra"));
  fireEvent.click(screen.getByTestId("sso-wizard-continue"));
}

describe("SsoWizardPage", () => {
  it("renders enterprise SSO wizard chrome without internal implementation language", () => {
    render(<SsoWizardPageClient />);

    expect(screen.getByRole("heading", { name: /Configure single sign-on/i })).toBeInTheDocument();
    expect(screen.getByTestId("page-heading-icon")).toBeInTheDocument();
    expect(screen.getByText(/test the connection before it can be activated/i)).toBeInTheDocument();
    expect(screen.getByTestId("sso-wizard-stepper")).toBeInTheDocument();
    expect(screen.getByTestId("sso-wizard-stepper")).toHaveTextContent("Identity provider");
    expect(screen.getByTestId("sso-idp-selector")).toBeInTheDocument();
    expect(screen.queryByTestId("sso-protocol-selector")).not.toBeInTheDocument();
    expect(screen.getByTestId("sso-wizard-continue")).toBeDisabled();

    const pageText = screen.getByTestId("sso-wizard-page").textContent ?? "";

    for (const pattern of SSO_WIZARD_BANNED_UI_PATTERNS) {
      expect(pageText, `expected no match for ${pattern}`).not.toMatch(pattern);
    }

    expect(pageText).not.toMatch(/IdP entity/i);
  });

  it("gates Continue on identity provider, then shows protocol step with Entra OIDC preset", () => {
    render(<SsoWizardPageClient />);

    const continueButton = screen.getByTestId("sso-wizard-continue");
    expect(continueButton).toBeDisabled();
    expect(screen.getByRole("radiogroup", { name: /identity provider/i })).toBeInTheDocument();
    expect(screen.getByText(/Select an identity provider to continue/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("sso-idp-entra"));
    expect(continueButton).toBeEnabled();

    fireEvent.click(continueButton);

    const protocolGroup = screen.getByRole("radiogroup", { name: /single sign-on protocol/i });
    expect(protocolGroup).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /OpenID Connect/i })).toBeChecked();
    expect(continueButton).toBeEnabled();

    fireEvent.click(continueButton);
    expect(screen.getByTestId("sso-metadata-url")).toBeInTheDocument();
  });

  it("exposes an accessible protocol radio group with Continue gating after Other", () => {
    render(<SsoWizardPageClient />);

    fireEvent.click(screen.getByTestId("sso-idp-other"));
    fireEvent.click(screen.getByTestId("sso-wizard-continue"));

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

    fireEvent.click(screen.getByTestId("sso-idp-entra"));
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/administration/identity-providers");

    confirmSpy.mockRestore();
  });

  it("expands protocol guidance without implementation leakage", () => {
    render(<SsoWizardPageClient />);

    selectEntraAndContinue();

    fireEvent.click(screen.getByText(/Not sure which protocol to choose/i));
    expect(screen.getByText(/Choose OpenID Connect when your provider supports it/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Configuration reference/i })).toHaveAttribute(
      "href",
      "/help/configuration-reference",
    );
    expect(screen.queryByRole("link", { name: /Enterprise onboarding checklist/i })).not.toBeInTheDocument();
  });

  it("shows durable in-page success after SSO activation without toast", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("/admin/identity/discover")) {
        return new Response(
          JSON.stringify({
            discoverySucceeded: true,
            issuerUri: "https://idp.example.com/",
            availableClaimNames: ["groups"],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("/admin/identity/test-login")) {
        return new Response(JSON.stringify({ success: true, mappedRoles: ["Admin"] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("/admin/identity/activate") && init?.method === "POST") {
        return new Response(JSON.stringify({ isActive: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<SsoWizardPageClient />);

    selectEntraAndContinue();
    fireEvent.click(screen.getByTestId("sso-wizard-continue"));

    fireEvent.change(screen.getByTestId("sso-metadata-url"), {
      target: { value: "https://idp.example.com/metadata" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Fetch provider metadata/i }));

    await screen.findByTestId("sso-wizard-success-callout");

    fireEvent.click(screen.getByTestId("sso-wizard-continue"));
    fireEvent.change(screen.getByTestId("sso-role-claim"), { target: { value: "groups" } });
    fireEvent.change(screen.getAllByPlaceholderText("e.g. al-admin-group")[0], { target: { value: "al-admins" } });
    fireEvent.click(screen.getByTestId("sso-wizard-continue"));

    fireEvent.change(screen.getByTestId("sso-sample-claims"), { target: { value: "al-admins" } });
    fireEvent.click(screen.getByRole("button", { name: /Test connection/i }));

    await waitFor(() => {
      expect(screen.getByTestId("sso-wizard-continue")).toBeEnabled();
    });

    fireEvent.click(screen.getByTestId("sso-wizard-continue"));

    expect(await screen.findByTestId("sso-wizard-activate")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("sso-wizard-activate"));

    expect(await screen.findByTestId("sso-wizard-success-callout")).toHaveTextContent(
      SSO_WIZARD_ACTIVATE_SUCCESS_MESSAGE,
    );
    expect(showSuccess).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
