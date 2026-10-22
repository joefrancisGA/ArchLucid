import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/lib/sign-in-methods-api", () => ({
  fetchSignInMethods: vi.fn(),
  requestEmailLinkChallenge: vi.fn(),
  verifyEmailLinkChallenge: vi.fn(),
  confirmSignInMethodLinkProposal: vi.fn(),
  cancelSignInMethodLinkProposal: vi.fn(),
  removeSignInMethod: vi.fn(),
}));

vi.mock("@/lib/frictionless-trial-session", () => ({
  readFrictionlessTrialSessionEnabled: () => false,
}));

import { AccountSecurityPageClient } from "@/app/(operator)/account/security/AccountSecurityPageClient";
import {
  ACCOUNT_SECURITY_FIRST_VIEWPORT_TEST_ID,
  ACCOUNT_SECURITY_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  ACCOUNT_SECURITY_PAGE_SUBTITLE,
  ACCOUNT_SECURITY_PAGE_SUBTITLE_BUYER,
  ACCOUNT_SECURITY_PAGE_TITLE,
  ACCOUNT_SECURITY_PRIMARY_CONTENT_ID,
  ACCOUNT_SECURITY_SKIP_LINK_LABEL,
  ACCOUNT_SECURITY_SKIP_TARGET_ID,
} from "@/lib/account-security-page-copy";
import {
  ACCOUNT_SECURITY_SETTINGS_CLAIM_DISCIPLINE,
  ACCOUNT_SECURITY_SETTINGS_FOLLOW_UPS_TITLE,
  ACCOUNT_SECURITY_SETTINGS_SOURCES,
} from "@/lib/account-security-settings-evidence-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { fetchSignInMethods } from "@/lib/sign-in-methods-api";

describe("AccountSecurityPageClient buyer-polished shell (ADS)", () => {
  beforeEach(() => {
    vi.mocked(fetchSignInMethods).mockResolvedValue([]);
  });

  it("renders skip link, sign-in methods before follow-ups, header claim discipline, and hides contextual help", async () => {
    render(<AccountSecurityPageClient />);

    expect(screen.getByRole("link", { name: ACCOUNT_SECURITY_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ACCOUNT_SECURITY_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(ACCOUNT_SECURITY_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(ACCOUNT_SECURITY_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId(ACCOUNT_SECURITY_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      ACCOUNT_SECURITY_SETTINGS_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("account-security-settings-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("account-security-auth-domains-vocabulary")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: ACCOUNT_SECURITY_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: ACCOUNT_SECURITY_PAGE_TITLE })).toBeInTheDocument();

    const primaryContent = screen.getByTestId(ACCOUNT_SECURITY_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(ACCOUNT_SECURITY_FIRST_VIEWPORT_TEST_ID);
    const orientationBottom = screen.getByTestId("account-security-orientation-bottom");
    const sourcesSection = screen.getByTestId("account-security-settings-sources");
    const methodsList = await screen.findByTestId("sign-in-methods-card");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport).toContainElement(methodsList);
    expect(orientationBottom).toContainElement(sourcesSection);

    for (const source of filterWhereToGoNextFollowUpLinks(ACCOUNT_SECURITY_SETTINGS_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
