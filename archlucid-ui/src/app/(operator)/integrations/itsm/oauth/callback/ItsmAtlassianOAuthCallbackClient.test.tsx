import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ItsmAtlassianOAuthCallbackClient } from "@/app/(operator)/integrations/itsm/oauth/callback/ItsmAtlassianOAuthCallbackClient";
import { ItsmAtlassianOAuthCallbackLoadingView } from "@/app/(operator)/integrations/itsm/oauth/callback/ItsmAtlassianOAuthCallbackLoadingView";
import { INTEGRATIONS_JIRA_PATH } from "@/lib/integrations-nav-paths";
import {
  ITSM_ATLASSIAN_OAUTH_CALLBACK_IDP_DENIED,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_INCOMPLETE_RESPONSE,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_REFRESH_TOKEN_STORE_FAILED,
} from "@/lib/itsm/itsm-atlassian-oauth-callback-error-copy";
import {
  ITSM_ATLASSIAN_OAUTH_CALLBACK_CONNECTOR_STATE_CONSENT_WITHOUT_CREDENTIAL,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_CONNECTOR_STATE_UNCHANGED,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_FAILURE_TITLE,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_DETAIL,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_TITLE,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_OPEN_JIRA_LABEL,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_SUCCESS_MESSAGE,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_SUCCESS_TITLE,
} from "@/lib/itsm/itsm-atlassian-oauth-callback-page-copy";
import {
  ITSM_OAUTH_CALLBACK_CANONICAL_PATH,
  ITSM_OAUTH_CALLBACK_SOURCES,
} from "@/lib/itsm/itsm-oauth-callback-evidence-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

const completeItsmAtlassianOAuthConsent = vi.fn();
const readOperatorScopeFromStorage = vi.fn();
let searchParams = new URLSearchParams("code=oauth-code&state=oauth-state");

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  completeItsmAtlassianOAuthConsent: (...args: unknown[]) => completeItsmAtlassianOAuthConsent(...args),
}));

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  readOperatorScopeFromStorage: () => readOperatorScopeFromStorage(),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

describe("ItsmAtlassianOAuthCallbackLoadingView", () => {
  it("shows in-card loading status tag and skeleton placeholders", () => {
    render(<ItsmAtlassianOAuthCallbackLoadingView />);

    expect(screen.getByTestId("itsm-oauth-callback-loading-status-tag")).toBeInTheDocument();
    expect(screen.getByTestId("itsm-oauth-callback-loading-status")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText(ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_DETAIL)).toBeInTheDocument();
    expect(screen.getByTestId("itsm-oauth-callback-loading-skeleton-card")).toBeInTheDocument();
  });
});

describe("ItsmAtlassianOAuthCallbackClient operator shell", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams("code=oauth-code&state=oauth-state");
    readOperatorScopeFromStorage.mockReturnValue({
      workspaceLabel: "Pilot workspace",
      tenantId: "tenant-1",
    });
    completeItsmAtlassianOAuthConsent.mockReset();
  });

  it("renders operator chrome while consent completion is in flight", () => {
    completeItsmAtlassianOAuthConsent.mockImplementation(() => new Promise(() => undefined));

    render(<ItsmAtlassianOAuthCallbackClient />);

    expect(screen.queryByTestId("auth-flow-shell")).not.toBeInTheDocument();
    expect(screen.queryByTestId("itsm-oauth-callback-breadcrumb")).toBeNull();
    expect(screen.getByTestId("itsm-oauth-callback-page-title")).toHaveTextContent(
      ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_TITLE,
    );
    expect(screen.getByTestId("itsm-oauth-callback-loading")).toBeInTheDocument();
    expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument();
  });

  it("shows Jira success copy with a primary Open Jira CTA and polite status region", async () => {
    completeItsmAtlassianOAuthConsent.mockResolvedValue({
      refreshTokenStored: true,
      correlationId: "corr-oauth-success",
    });

    render(<ItsmAtlassianOAuthCallbackClient />);

    await waitFor(() => {
      expect(screen.getByTestId("itsm-oauth-callback-open-jira")).toBeInTheDocument();
    });

    expect(screen.getByTestId("itsm-oauth-callback-page-title")).toHaveTextContent(
      ITSM_ATLASSIAN_OAUTH_CALLBACK_SUCCESS_TITLE,
    );
    expect(screen.getByText(ITSM_ATLASSIAN_OAUTH_CALLBACK_SUCCESS_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(/ITSM settings/i)).not.toBeInTheDocument();

    const message = screen.getByTestId("itsm-oauth-callback-message");
    expect(message).toHaveAttribute("role", "status");
    expect(message).toHaveAttribute("aria-live", "polite");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    const openJira = screen.getByRole("link", { name: ITSM_ATLASSIAN_OAUTH_CALLBACK_OPEN_JIRA_LABEL });
    expect(openJira).toHaveAttribute("href", INTEGRATIONS_JIRA_PATH);

    const sources = screen.getByTestId("itsm-oauth-callback-sources");
    expect(within(sources).getByRole("link", { name: "Audit" })).toHaveAttribute("href", GOVERNANCE_AUDIT_PATH);
    expect(
      within(sources).queryByRole("link", { name: new RegExp(ITSM_OAUTH_CALLBACK_CANONICAL_PATH, "i") }),
    ).not.toBeInTheDocument();

    expect(document.activeElement).toBe(screen.getByTestId("itsm-oauth-callback-outcome"));
  });
});

describe("ItsmAtlassianOAuthCallbackClient failure branches", () => {
  beforeEach(() => {
    readOperatorScopeFromStorage.mockReturnValue({
      workspaceLabel: "Pilot workspace",
      tenantId: "tenant-1",
    });
    completeItsmAtlassianOAuthConsent.mockReset();
  });

  async function expectFailureChrome() {
    await waitFor(() => {
      expect(screen.getByTestId("itsm-oauth-callback-failure-status")).toBeInTheDocument();
    });

    expect(screen.getByTestId("itsm-oauth-callback-page-title")).toHaveTextContent(
      ITSM_ATLASSIAN_OAUTH_CALLBACK_FAILURE_TITLE,
    );
    expect(screen.getByTestId("itsm-oauth-callback-failure-status")).toHaveTextContent("Consent failed");
    expect(screen.getByTestId("itsm-oauth-callback-failure-callout")).toHaveClass("border-l-4");
    expect(screen.getByTestId("itsm-oauth-callback-failure-callout")).toHaveAttribute("role", "alert");
    expect(screen.getByTestId("itsm-oauth-callback-message")).not.toHaveAttribute("aria-live", "polite");

    const retry = screen.getByRole("link", { name: /Try Connect with Atlassian again/i });
    expect(retry).toHaveAttribute("href", INTEGRATIONS_JIRA_PATH);
    expect(screen.getByTestId("itsm-oauth-callback-retry").tagName).toBe("A");

    const support = screen.getByRole("link", { name: /Contact support/i });
    expect(support).toHaveClass("underline");
    expect(support.getAttribute("href")).toMatch(/^mailto:support@archlucid\.net\?/);

    const sources = screen.getByTestId("itsm-oauth-callback-sources");
    expect(within(sources).getByRole("link", { name: "Audit" })).toHaveAttribute("href", GOVERNANCE_AUDIT_PATH);

    expect(document.activeElement).toBe(screen.getByTestId("itsm-oauth-callback-outcome"));
  }

  it("maps IdP denial to blocked callout with unchanged connector state", async () => {
    searchParams = new URLSearchParams("error=access_denied");

    render(<ItsmAtlassianOAuthCallbackClient />);

    await expectFailureChrome();
    expect(screen.getByText(ITSM_ATLASSIAN_OAUTH_CALLBACK_IDP_DENIED)).toBeInTheDocument();
    expect(screen.getByTestId("itsm-oauth-callback-connector-state")).toHaveTextContent(
      ITSM_ATLASSIAN_OAUTH_CALLBACK_CONNECTOR_STATE_UNCHANGED,
    );
  });

  it("maps incomplete OAuth response to unchanged connector state", async () => {
    searchParams = new URLSearchParams("code=only-code");

    render(<ItsmAtlassianOAuthCallbackClient />);

    await expectFailureChrome();
    expect(screen.getByText(ITSM_ATLASSIAN_OAUTH_CALLBACK_INCOMPLETE_RESPONSE)).toBeInTheDocument();
    expect(screen.getByTestId("itsm-oauth-callback-connector-state")).toHaveTextContent(
      ITSM_ATLASSIAN_OAUTH_CALLBACK_CONNECTOR_STATE_UNCHANGED,
    );
  });

  it("maps refresh-token store failure to consent-without-credential connector state", async () => {
    searchParams = new URLSearchParams("code=oauth-code&state=oauth-state");
    completeItsmAtlassianOAuthConsent.mockResolvedValue({
      refreshTokenStored: false,
      correlationId: "corr-oauth-token-store",
    });

    render(<ItsmAtlassianOAuthCallbackClient />);

    await expectFailureChrome();
    expect(screen.getByText(ITSM_ATLASSIAN_OAUTH_CALLBACK_REFRESH_TOKEN_STORE_FAILED)).toBeInTheDocument();
    expect(screen.getByTestId("itsm-oauth-callback-connector-state")).toHaveTextContent(
      ITSM_ATLASSIAN_OAUTH_CALLBACK_CONNECTOR_STATE_CONSENT_WITHOUT_CREDENTIAL,
    );
  });

  it("uses the API request correlation id when consent completion fails", async () => {
    searchParams = new URLSearchParams("code=oauth-code&state=oauth-state");
    const { ApiRequestError } = await import("@/lib/api-request-error");
    completeItsmAtlassianOAuthConsent.mockRejectedValue(
      new ApiRequestError("Consent exchange failed", {
        problem: null,
        correlationId: "corr-api-failure",
        httpStatus: 502,
      }),
    );

    render(<ItsmAtlassianOAuthCallbackClient />);

    await expectFailureChrome();

    fireEvent.click(screen.getByText("Details for support"));

    expect(screen.getByTestId("itsm-oauth-callback-support-details")).toHaveTextContent("corr-api-failure");
    expect(completeItsmAtlassianOAuthConsent).toHaveBeenCalledWith(
      { code: "oauth-code", state: "oauth-state" },
      expect.objectContaining({ correlationId: expect.any(String) }),
    );
  });

  it("exposes support reference disclosure without forbidden substrings", async () => {
    searchParams = new URLSearchParams("error=access_denied");

    render(<ItsmAtlassianOAuthCallbackClient />);

    await expectFailureChrome();

    fireEvent.click(screen.getByText("Details for support"));

    const details = screen.getByTestId("itsm-oauth-callback-support-details");
    expect(within(details).getByText(/Pilot workspace/)).toBeInTheDocument();
    expect(within(details).getByText(/\d{4}.*UTC/)).toBeInTheDocument();
    expect(within(details).getByLabelText("Copy reference ID")).toBeInTheDocument();

    const renderedText = details.textContent ?? "";
    expect(renderedText).not.toMatch(/client_secret|refresh_token|SqlException|StackTrace/i);

    const supportHref = screen.getByRole("link", { name: /Contact support/i }).getAttribute("href") ?? "";
    expect(supportHref).toContain(encodeURIComponent("Reference ID:"));
    expect(supportHref).toContain(encodeURIComponent("Timestamp (UTC):"));
    expect(supportHref).toContain(encodeURIComponent("Pilot workspace"));
    expect(supportHref).not.toMatch(/client_secret|refresh_token/i);
  });
});

describe("ItsmAtlassianOAuthCallbackClient sources strip", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams("error=access_denied");
    readOperatorScopeFromStorage.mockReturnValue(null);
  });

  it("renders configured follow-up sources without a self-href", async () => {
    render(<ItsmAtlassianOAuthCallbackClient />);

    await waitFor(() => {
      expect(screen.getByTestId("itsm-oauth-callback-sources")).toBeInTheDocument();
    });

    const sources = screen.getByTestId("itsm-oauth-callback-sources");

    for (const link of ITSM_OAUTH_CALLBACK_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(ITSM_OAUTH_CALLBACK_CANONICAL_PATH, "i") }),
    ).not.toBeInTheDocument();
  });
});
