import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ItsmAtlassianOAuthCallbackClient } from "@/app/(operator)/integrations/itsm/oauth/callback/ItsmAtlassianOAuthCallbackClient";
import { INTEGRATIONS_JIRA_PATH } from "@/lib/integrations-nav-paths";
import {
  ITSM_ATLASSIAN_OAUTH_CALLBACK_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_TITLE,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_OPEN_JIRA_LABEL,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_SKIP_LINK_LABEL,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_SKIP_TARGET_ID,
} from "@/lib/itsm/itsm-atlassian-oauth-callback-page-copy";
import {
  ITSM_OAUTH_CALLBACK_CLAIM_DISCIPLINE,
  ITSM_OAUTH_CALLBACK_FOLLOW_UPS_TITLE,
} from "@/lib/itsm/itsm-oauth-callback-evidence-copy";

const completeItsmAtlassianOAuthConsent = vi.fn();
let searchParams = new URLSearchParams("code=oauth-code&state=oauth-state");

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  completeItsmAtlassianOAuthConsent: (...args: unknown[]) => completeItsmAtlassianOAuthConsent(...args),
}));

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  readOperatorScopeFromStorage: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

describe("ItsmAtlassianOAuthCallbackClient buyer-polished shell", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams("code=oauth-code&state=oauth-state");
    completeItsmAtlassianOAuthConsent.mockImplementation(() => new Promise(() => undefined));
  });

  it("renders skip link, outcome before follow-ups, and hides contextual help", () => {
    render(<ItsmAtlassianOAuthCallbackClient />);

    const skipLink = screen.getByRole("link", { name: ITSM_ATLASSIAN_OAUTH_CALLBACK_SKIP_LINK_LABEL });
    expect(skipLink).toHaveAttribute("href", `#${ITSM_ATLASSIAN_OAUTH_CALLBACK_SKIP_TARGET_ID}`);

    expect(screen.getByTestId("itsm-oauth-callback-page-title")).toHaveTextContent(
      ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_TITLE,
    );
    expect(screen.queryByTestId("itsm-oauth-callback-breadcrumb")).toBeNull();
    expect(screen.queryByTestId("page-contextual-help-button")).toBeNull();
    expect(screen.getByTestId("itsm-oauth-callback-open-jira-header")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: ITSM_ATLASSIAN_OAUTH_CALLBACK_OPEN_JIRA_LABEL })).toHaveAttribute(
      "href",
      INTEGRATIONS_JIRA_PATH,
    );

    expect(screen.getByTestId(ITSM_ATLASSIAN_OAUTH_CALLBACK_HEADER_CLAIM_DISCIPLINE_TEST_ID).textContent).toContain(
      ITSM_OAUTH_CALLBACK_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("itsm-oauth-callback-claim-discipline")).toBeNull();

    const primaryContent = screen.getByTestId("itsm-oauth-callback-primary-content");
    const firstViewport = screen.getByTestId("itsm-oauth-callback-first-viewport");
    const orientation = screen.getByTestId("itsm-oauth-callback-orientation-bottom");
    const outcome = screen.getByTestId("itsm-oauth-callback-outcome");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(outcome);
    expect(primaryContent).toContainElement(orientation);
    expect(firstViewport.compareDocumentPosition(orientation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(screen.getByRole("heading", { level: 2, name: ITSM_OAUTH_CALLBACK_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByTestId("itsm-oauth-callback-orientation-top")).toBeNull();
    expect(screen.queryByTestId("itsm-oauth-callback-claim-discipline")).toBeNull();
  });
});
