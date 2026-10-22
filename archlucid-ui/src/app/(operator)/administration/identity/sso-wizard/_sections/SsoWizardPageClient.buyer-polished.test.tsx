import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/administration/identity/sso-wizard",
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/lib/admin-identity-provider-api", () => ({
  fetchTenantIdentityProviderConfiguration: vi.fn(async () => null),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { SsoWizardPageClient } from "./SsoWizardPageClient";
import {
  SSO_WIZARD_PAGE_INTRO,
  SSO_WIZARD_PAGE_SUBTITLE_BUYER,
} from "@/lib/sso-wizard-copy";
import {
  SSO_WIZARD_SETTINGS_FIRST_VIEWPORT_TEST_ID,
  SSO_WIZARD_SETTINGS_PRIMARY_CONTENT_ID,
  SSO_WIZARD_SETTINGS_SKIP_LINK_LABEL,
} from "@/lib/sso-wizard-settings-page-copy";

describe("SsoWizardPageClient buyer-polished shell (ASS)", () => {
  it("renders skip link, first-viewport orientation, and buyer subtitle", () => {
    render(<SsoWizardPageClient />);

    expect(screen.getByRole("link", { name: SSO_WIZARD_SETTINGS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SSO_WIZARD_SETTINGS_FIRST_VIEWPORT_TEST_ID}`,
    );
    expect(screen.getByTestId(SSO_WIZARD_SETTINGS_PRIMARY_CONTENT_ID)).toHaveAttribute(
      "id",
      SSO_WIZARD_SETTINGS_PRIMARY_CONTENT_ID,
    );
    expect(screen.getByTestId("sso-wizard-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("sso-wizard-settings-sources")).toBeInTheDocument();
    expect(screen.getByText(SSO_WIZARD_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(SSO_WIZARD_PAGE_INTRO)).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sso-wizard-back-link")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sso-wizard-related-surfaces-disclosure")).not.toBeInTheDocument();

    const firstViewport = screen.getByTestId(SSO_WIZARD_SETTINGS_FIRST_VIEWPORT_TEST_ID);
    const stepper = screen.getByTestId("sso-wizard-stepper");

    expect(firstViewport.compareDocumentPosition(stepper) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(firstViewport).toContainElement(screen.getByTestId("sso-wizard-orientation-top"));
  });
});
