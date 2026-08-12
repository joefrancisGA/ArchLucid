import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ItsmAtlassianOAuthCallbackClient } from "@/app/(operator)/integrations/itsm/oauth/callback/ItsmAtlassianOAuthCallbackClient";
import { ItsmAtlassianOAuthCallbackLoadingView } from "@/app/(operator)/integrations/itsm/oauth/callback/ItsmAtlassianOAuthCallbackLoadingView";
import { INTEGRATIONS_JIRA_PATH } from "@/lib/integrations-nav-paths";
import {
  ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_DETAIL,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_OPEN_JIRA_LABEL,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_PAGE_TITLE,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_SUCCESS_MESSAGE,
} from "@/lib/itsm/itsm-atlassian-oauth-callback-page-copy";

const completeItsmAtlassianOAuthConsent = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () =>
    new URLSearchParams("code=oauth-code&state=oauth-state"),
}));

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  completeItsmAtlassianOAuthConsent: (...args: unknown[]) => completeItsmAtlassianOAuthConsent(...args),
}));

describe("ItsmAtlassianOAuthCallbackLoadingView (TB-1782)", () => {
  it("shows auth-flow loading chrome with status tag and skeleton placeholders", () => {
    render(<ItsmAtlassianOAuthCallbackLoadingView />);

    expect(screen.getByRole("heading", { level: 1, name: ITSM_ATLASSIAN_OAUTH_CALLBACK_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("itsm-oauth-callback-loading-status-tag")).toBeInTheDocument();
    expect(screen.getByTestId("itsm-oauth-callback-loading-status")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText(ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_DETAIL)).toBeInTheDocument();
    expect(screen.getByTestId("itsm-oauth-callback-loading-skeleton-card")).toBeInTheDocument();
  });
});

describe("ItsmAtlassianOAuthCallbackClient (TB-1782)", () => {
  it("renders AuthFlowShell while consent completion is in flight", () => {
    completeItsmAtlassianOAuthConsent.mockImplementation(() => new Promise(() => undefined));

    render(<ItsmAtlassianOAuthCallbackClient />);

    expect(screen.getByTestId("auth-flow-shell")).toBeInTheDocument();
    expect(screen.getByTestId("itsm-oauth-callback-loading")).toBeInTheDocument();
  });
});

describe("ItsmAtlassianOAuthCallbackClient (TB-1783)", () => {
  it("shows Jira success copy with a primary Open Jira CTA and no ITSM settings wording", async () => {
    completeItsmAtlassianOAuthConsent.mockResolvedValue({ refreshTokenStored: true });

    render(<ItsmAtlassianOAuthCallbackClient />);

    await waitFor(() => {
      expect(screen.getByTestId("itsm-oauth-callback-open-jira")).toBeInTheDocument();
    });

    expect(screen.getByText(ITSM_ATLASSIAN_OAUTH_CALLBACK_SUCCESS_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(/ITSM settings/i)).not.toBeInTheDocument();

    const openJira = screen.getByRole("link", { name: ITSM_ATLASSIAN_OAUTH_CALLBACK_OPEN_JIRA_LABEL });
    expect(openJira).toHaveAttribute("href", INTEGRATIONS_JIRA_PATH);
  });
});
