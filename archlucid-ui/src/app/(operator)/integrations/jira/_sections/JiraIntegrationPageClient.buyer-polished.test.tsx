import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchHealth = vi.fn();
const mockFetchSettings = vi.fn();
const mockFetchConnection = vi.fn();

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 0,
}));

vi.mock("@/lib/features", () => ({
  isShowSystemAdministrationNavEnabled: () => false,
}));

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

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  fetchItsmIntegrationHealth: (...args: unknown[]) => mockFetchHealth(...args),
  fetchTenantItsmOutboundSettings: (...args: unknown[]) => mockFetchSettings(...args),
  fetchTenantItsmConnectorConnection: (...args: unknown[]) => mockFetchConnection(...args),
  probeItsmIntegrationHealth: vi.fn(),
  upsertTenantItsmOutboundSettings: vi.fn(),
}));

vi.mock("@/lib/jira-atlassian-oauth-connect", () => ({
  launchJiraAtlassianOAuthConnect: vi.fn(),
}));

import { JiraIntegrationPageClient } from "./JiraIntegrationPageClient";
import {
  JIRA_INTEGRATION_FIRST_VIEWPORT_TEST_ID,
  JIRA_INTEGRATION_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  JIRA_INTEGRATION_PAGE_SUBTITLE_BUYER,
  JIRA_INTEGRATION_PRIMARY_CONTENT_ID,
  JIRA_INTEGRATION_SKIP_LINK_LABEL,
  JIRA_INTEGRATION_SKIP_TARGET_ID,
} from "@/lib/jira-integration-shell-page-copy";
import {
  JIRA_INTEGRATION_CLAIM_DISCIPLINE,
  JIRA_INTEGRATION_FOLLOW_UPS_TITLE,
  JIRA_INTEGRATION_SOURCES,
} from "@/lib/jira-integration-evidence-copy";
import { JIRA_INTEGRATION_PAGE_TITLE, JIRA_PAGE_SUBTITLE } from "@/lib/jira-integration-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

function baseHealth() {
  return {
    nativeEnabled: true,
    jira: { locallyConfigured: false, reachable: null, summary: "pending" },
    serviceNow: { locallyConfigured: false, summary: "skip" },
  };
}

function baseSettings() {
  return {
    nativeEnabled: true,
    deploymentCredentials: { jiraConfigured: false },
  };
}

function baseConnection() {
  return {
    provider: "jira",
    isConfigured: false,
    instanceBaseUrl: null,
    authMode: null,
  };
}

describe("JiraIntegrationPageClient buyer-polished shell (IJX)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchHealth.mockResolvedValue(baseHealth());
    mockFetchSettings.mockResolvedValue(baseSettings());
    mockFetchConnection.mockResolvedValue(baseConnection());
  });

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides operator chrome", async () => {
    render(<JiraIntegrationPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("jira-connection-status")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: JIRA_INTEGRATION_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${JIRA_INTEGRATION_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(JIRA_INTEGRATION_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(JIRA_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId(JIRA_INTEGRATION_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      JIRA_INTEGRATION_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("jira-readiness-link")).not.toBeInTheDocument();
    expect(screen.queryByTestId("itsm-connector-provider-chooser")).not.toBeInTheDocument();
    expect(screen.getByTestId("jira-refresh-button")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: JIRA_INTEGRATION_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("jira-page-title")).toHaveTextContent(JIRA_INTEGRATION_PAGE_TITLE);

    const primaryContent = screen.getByTestId(JIRA_INTEGRATION_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(JIRA_INTEGRATION_FIRST_VIEWPORT_TEST_ID);
    const pageMain = screen.getByTestId("jira-page-main");
    const orientationBottom = screen.getByTestId("jira-integration-orientation-bottom");
    const sourcesSection = screen.getByTestId("jira-integration-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport).toContainElement(pageMain);
    expect(orientationBottom).toContainElement(sourcesSection);

    for (const source of filterWhereToGoNextFollowUpLinks(JIRA_INTEGRATION_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
