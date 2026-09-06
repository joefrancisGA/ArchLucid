import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const navigationMocks = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
}));
const replaceMock = vi.fn((href: string) => {
  const queryIndex = href.indexOf("?");

  navigationMocks.searchParams = new URLSearchParams(
    queryIndex >= 0 ? href.slice(queryIndex + 1) : "",
  );
});

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: () => ({ push: pushMock, replace: replaceMock }),
    usePathname: () => "/administration/identity/sso-wizard",
    useSearchParams: () => navigationMocks.searchParams,
  };
});

vi.mock("@/lib/admin-identity-provider-api", () => ({
  fetchTenantIdentityProviderConfiguration: vi.fn(async () => null),
}));

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (init: RequestInit) => init,
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: () => <button type="button">Page help</button>,
}));

import { SsoWizardPageClient } from "./_sections/SsoWizardPageClient";
import {
  SSO_WIZARD_BANNED_UI_PATTERNS,
  SSO_WIZARD_CONFIGURATION_EFFECT_LINE,
  SSO_WIZARD_IDENTITY_PROVIDERS_HREF,
  SSO_WIZARD_RELATED_SURFACES_DISCLOSURE_TITLE,
  SSO_WIZARD_VERIFY_CLAIM_MAPPING_BUTTON,
} from "@/lib/sso-wizard-copy";
import {
  SSO_WIZARD_ACTIVATE_SUCCESS_MESSAGE,
  SSO_WIZARD_TEST_LOGIN_SUCCESS_MESSAGE,
} from "@/lib/admin-integration-mutation-outcome-copy";
import { showSuccess } from "@/lib/toast";

beforeEach(() => {
  pushMock.mockReset();
  replaceMock.mockReset();
  navigationMocks.searchParams = new URLSearchParams();
});

function selectEntraAndContinue(): void {
  fireEvent.click(screen.getByTestId("sso-idp-entra"));
  fireEvent.click(screen.getByTestId("sso-wizard-continue"));
}

describe("SsoWizardPage", () => {
  it("renders enterprise SSO wizard chrome without internal implementation language", () => {
    render(<SsoWizardPageClient />);

    expect(screen.getByRole("heading", { name: /Configure single sign-on/i })).toBeInTheDocument();
    expect(screen.getByTestId("page-heading-icon")).toBeInTheDocument();
    expect(screen.getByText(/Record and verify your organization's identity provider configuration/i)).toBeInTheDocument();
    expect(screen.getByTestId("sso-wizard-stepper")).toBeInTheDocument();
    expect(screen.getByTestId("sso-wizard-stepper")).toHaveTextContent("Identity provider");
    expect(screen.getByTestId("sso-idp-selector")).toBeInTheDocument();
    expect(screen.queryByTestId("sso-protocol-selector")).not.toBeInTheDocument();
    expect(screen.getByTestId("sso-wizard-continue")).toBeDisabled();

    const page = screen.getByTestId("sso-wizard-page");
    expect(page.className).toContain("w-full max-w-[62rem]");
    expect(page.className).not.toContain("mx-auto");

    const pageText = page.textContent ?? "";

    for (const pattern of SSO_WIZARD_BANNED_UI_PATTERNS) {
      expect(pageText, `expected no match for ${pattern}`).not.toMatch(pattern);
    }

    expect(pageText).not.toMatch(/IdP entity/i);
    expect(pageText).not.toMatch(/activated for users/i);
    expect(pageText).not.toMatch(/preset/i);
  });

  it("shows one configuration effect line between the title and stepper", () => {
    render(<SsoWizardPageClient />);

    const effectLink = screen.getByTestId("sso-wizard-platform-change-link");
    expect(effectLink).toHaveAttribute("href", "/administration/identity-providers/diagnostics");
    expect(effectLink).toHaveTextContent(/separate platform configuration change/i);
    expect(effectLink.parentElement?.textContent).toContain(SSO_WIZARD_CONFIGURATION_EFFECT_LINE);

    const header = screen.getByRole("heading", { name: /Configure single sign-on/i });
    const stepper = screen.getByTestId("sso-wizard-stepper");

    expect(header.compareDocumentPosition(stepper) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(effectLink.compareDocumentPosition(stepper) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("places vocabulary rails in a collapsed disclosure below the wizard card", () => {
    render(<SsoWizardPageClient />);

    const header = screen.getByRole("heading", { name: /Configure single sign-on/i }).closest("header");
    const stepper = screen.getByTestId("sso-wizard-stepper");
    const disclosure = screen.getByTestId("sso-wizard-related-surfaces-disclosure");

    expect(header?.querySelector('[data-testid="identity-providers-sso-wizard-vocabulary"]')).toBeNull();
    expect(header?.querySelector('[data-testid="sso-wizard-scim-vocabulary"]')).toBeNull();
    expect(stepper.compareDocumentPosition(disclosure) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText(SSO_WIZARD_RELATED_SURFACES_DISCLOSURE_TITLE)).toBeInTheDocument();

    expect(
      disclosure.querySelector('[data-testid="identity-providers-sso-wizard-vocabulary"]'),
    ).toBeInTheDocument();
    expect(disclosure.querySelector('[data-testid="sso-wizard-scim-vocabulary"]')).toBeInTheDocument();
    expect(
      disclosure.querySelector('[data-testid="identity-providers-sso-wizard-vocabulary"]')?.textContent?.toLowerCase(),
    ).not.toContain("activates sign-in");
  });

  it("gates Continue on identity provider with a single readiness hint", () => {
    render(<SsoWizardPageClient />);

    const continueButton = screen.getByTestId("sso-wizard-continue");
    expect(continueButton).toBeDisabled();
    expect(screen.getByRole("radiogroup", { name: /identity provider/i })).toBeInTheDocument();
    expect(screen.getByTestId("sso-wizard-primary-disabled-hint")).toHaveTextContent(/identity provider/i);
    expect(screen.getAllByText(/identity provider/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/Select an identity provider to continue/i)).not.toBeInTheDocument();

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

  it("provides cancel navigation back to identity providers", async () => {
    render(<SsoWizardPageClient />);

    fireEvent.click(screen.getByTestId("sso-idp-entra"));
    await waitFor(() => {
      expect(screen.getByTestId("sso-wizard-continue")).toBeEnabled();
    });
    fireEvent.click(screen.getByRole("button", { name: /^Cancel$/i }));

    expect(await screen.findByText("Leave SSO setup?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Leave without saving/i }));

    expect(pushMock).toHaveBeenCalledWith(SSO_WIZARD_IDENTITY_PROVIDERS_HREF);
  });

  it("expands protocol guidance without implementation leakage", () => {
    render(<SsoWizardPageClient />);

    selectEntraAndContinue();

    fireEvent.click(screen.getByText(/Not sure which protocol to choose/i));
    expect(screen.getByText(/Choose OpenID Connect when your provider supports it/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Authentication and sign-in/i })).toHaveAttribute(
      "href",
      "/help/authentication-sign-in",
    );
    expect(screen.queryByRole("link", { name: /Enterprise onboarding checklist/i })).not.toBeInTheDocument();
  });

  it("shows durable in-page success after configuration save without claiming SSO is active", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("/admin/identity/configuration")) {
        return new Response("not found", { status: 404 });
      }

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
    fireEvent.click(screen.getByRole("button", { name: SSO_WIZARD_VERIFY_CLAIM_MAPPING_BUTTON }));

    await waitFor(() => {
      expect(screen.getByTestId("sso-wizard-success-callout")).toHaveTextContent(
        SSO_WIZARD_TEST_LOGIN_SUCCESS_MESSAGE,
      );
    });

    fireEvent.click(screen.getByTestId("sso-wizard-continue"));

    expect(await screen.findByTestId("sso-wizard-activate")).toHaveTextContent(/Save configuration/i);
    expect(screen.getByTestId("sso-activate-consequence-preview")).toBeInTheDocument();
    expect(screen.getByTestId("sso-activate-consequence-preview-summary").textContent?.toLowerCase()).toContain(
      "does not change how anyone signs in today",
    );

    expect(screen.getByTestId("sso-activate-consequence-preview-platform-change-link")).toHaveAttribute(
      "href",
      "/administration/identity-providers/diagnostics",
    );

    fireEvent.click(screen.getByTestId("sso-wizard-activate"));

    const successCallout = await screen.findByTestId("sso-wizard-success-callout");
    expect(successCallout).toHaveTextContent(SSO_WIZARD_ACTIVATE_SUCCESS_MESSAGE);
    expect(successCallout.textContent?.toLowerCase()).not.toContain("single sign-on activated");
    expect(screen.getByTestId("sso-wizard-post-save-next-action")).toBeInTheDocument();
    expect(showSuccess).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
