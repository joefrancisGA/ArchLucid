import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchHealth = vi.fn();
const mockFetchSettings = vi.fn();
const mockFetchConnection = vi.fn();

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 2,
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

import { ServiceNowIntegrationPageClient } from "./ServiceNowIntegrationPageClient";
import {
  SERVICENOW_INTEGRATION_FIRST_VIEWPORT_TEST_ID,
  SERVICENOW_INTEGRATION_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  SERVICENOW_INTEGRATION_PAGE_SUBTITLE_BUYER,
  SERVICENOW_INTEGRATION_PRIMARY_CONTENT_ID,
  SERVICENOW_INTEGRATION_SKIP_LINK_LABEL,
  SERVICENOW_INTEGRATION_SKIP_TARGET_ID,
} from "@/lib/servicenow-integration-shell-page-copy";
import {
  SERVICENOW_INTEGRATION_CLAIM_DISCIPLINE,
  SERVICENOW_INTEGRATION_FOLLOW_UPS_TITLE,
  SERVICENOW_INTEGRATION_SOURCES,
} from "@/lib/servicenow-integration-evidence-copy";
import {
  SERVICENOW_INTEGRATION_PAGE_TITLE,
  SERVICENOW_PAGE_SUBTITLE,
} from "@/lib/servicenow-integration-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

function baseHealth() {
  return {
    nativeEnabled: true,
    serviceNow: { locallyConfigured: false, reachable: null, summary: "pending" },
  };
}

function baseSettings() {
  return {
    nativeEnabled: true,
    serviceNowAutoCreateCmdbCi: false,
    deploymentCredentials: { serviceNowConfigured: false },
  };
}

function baseConnection() {
  return {
    provider: "servicenow",
    isConfigured: false,
    instanceBaseUrl: null,
    authMode: null,
  };
}

describe("ServiceNowIntegrationPageClient buyer-polished shell (ISX)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchHealth.mockResolvedValue(baseHealth());
    mockFetchSettings.mockResolvedValue(baseSettings());
    mockFetchConnection.mockResolvedValue(baseConnection());
  });

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides operator chrome", async () => {
    render(<ServiceNowIntegrationPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("servicenow-connection-status")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: SERVICENOW_INTEGRATION_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SERVICENOW_INTEGRATION_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(SERVICENOW_INTEGRATION_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(SERVICENOW_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId(SERVICENOW_INTEGRATION_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      SERVICENOW_INTEGRATION_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("servicenow-readiness-link")).not.toBeInTheDocument();
    expect(screen.queryByTestId("itsm-connector-provider-chooser")).not.toBeInTheDocument();
    expect(screen.getByTestId("servicenow-refresh-button")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SERVICENOW_INTEGRATION_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("servicenow-page-title")).toHaveTextContent(SERVICENOW_INTEGRATION_PAGE_TITLE);

    const primaryContent = screen.getByTestId(SERVICENOW_INTEGRATION_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(SERVICENOW_INTEGRATION_FIRST_VIEWPORT_TEST_ID);
    const pageMain = screen.getByTestId("servicenow-page-main");
    const orientationBottom = screen.getByTestId("servicenow-integration-orientation-bottom");
    const sourcesSection = screen.getByTestId("servicenow-integration-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport).toContainElement(pageMain);
    expect(orientationBottom).toContainElement(sourcesSection);

    for (const source of filterWhereToGoNextFollowUpLinks(SERVICENOW_INTEGRATION_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
