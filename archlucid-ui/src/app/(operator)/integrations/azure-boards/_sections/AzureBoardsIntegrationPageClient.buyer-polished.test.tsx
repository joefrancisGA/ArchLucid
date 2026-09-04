import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchAzureSettings = vi.fn();
const mockFetchItsmHealth = vi.fn();
const mockFetchConnection = vi.fn();

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
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

vi.mock("@/lib/api/azure-boards-api", () => ({
  fetchAzureBoardsSettings: (...args: unknown[]) => mockFetchAzureSettings(...args),
  listAzureBoardsProjects: vi.fn().mockResolvedValue([]),
  listAzureBoardsWorkItemTypes: vi.fn().mockResolvedValue([]),
  testAzureBoardsConnection: vi.fn(),
  upsertAzureBoardsSettings: vi.fn(),
}));

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  fetchItsmIntegrationHealth: (...args: unknown[]) => mockFetchItsmHealth(...args),
  fetchTenantItsmConnectorConnection: (...args: unknown[]) => mockFetchConnection(...args),
  upsertTenantItsmConnectorConnection: vi.fn(),
}));

import { AzureBoardsIntegrationPageClient } from "@/app/(operator)/integrations/azure-boards/_sections/AzureBoardsIntegrationPageClient";
import {
  AZURE_BOARDS_INTEGRATION_FIRST_VIEWPORT_TEST_ID,
  AZURE_BOARDS_INTEGRATION_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  AZURE_BOARDS_INTEGRATION_PAGE_SUBTITLE_BUYER,
  AZURE_BOARDS_INTEGRATION_PRIMARY_CONTENT_ID,
  AZURE_BOARDS_INTEGRATION_SKIP_LINK_LABEL,
  AZURE_BOARDS_INTEGRATION_SKIP_TARGET_ID,
} from "@/lib/azure-boards-integration-page-copy";
import {
  AZURE_BOARDS_INTEGRATION_CLAIM_DISCIPLINE,
  AZURE_BOARDS_INTEGRATION_FOLLOW_UPS_TITLE,
  AZURE_BOARDS_INTEGRATION_SOURCES,
} from "@/lib/azure-boards-integration-evidence-copy";
import { AZURE_BOARDS_PAGE_SUBTITLE, AZURE_BOARDS_PAGE_TITLE } from "@/lib/azure-boards-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

function baseSettings(): Record<string, unknown> {
  return {
    isConfigured: false,
    projectName: null,
    defaultWorkItemType: null,
  };
}

function baseConnection(): Record<string, unknown> {
  return {
    provider: "AzureBoards",
    isConfigured: false,
    instanceBaseUrl: null,
    credentialKeyVaultSecretName: null,
  };
}

describe("AzureBoardsIntegrationPageClient buyer-polished shell (INZ)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchItsmHealth.mockResolvedValue({ nativeEnabled: true });
    mockFetchAzureSettings.mockResolvedValue(baseSettings());
    mockFetchConnection.mockResolvedValue(baseConnection());
  });

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides contextual help", async () => {
    render(<AzureBoardsIntegrationPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("azure-boards-page-content")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: AZURE_BOARDS_INTEGRATION_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${AZURE_BOARDS_INTEGRATION_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(AZURE_BOARDS_INTEGRATION_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(AZURE_BOARDS_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId(AZURE_BOARDS_INTEGRATION_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      AZURE_BOARDS_INTEGRATION_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("azure-boards-integration-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("azure-boards-readiness-link")).not.toBeInTheDocument();
    expect(screen.queryByTestId("itsm-connector-provider-chooser")).not.toBeInTheDocument();
    expect(screen.getByTestId("azure-boards-refresh-button")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: AZURE_BOARDS_INTEGRATION_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("azure-boards-page-title")).toHaveTextContent(AZURE_BOARDS_PAGE_TITLE);

    const primaryContent = screen.getByTestId(AZURE_BOARDS_INTEGRATION_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(AZURE_BOARDS_INTEGRATION_FIRST_VIEWPORT_TEST_ID);
    const pageContent = screen.getByTestId("azure-boards-page-content");
    const orientationBottom = screen.getByTestId("azure-boards-integration-orientation-bottom");
    const sourcesSection = screen.getByTestId("azure-boards-integration-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport).toContainElement(pageContent);
    expect(orientationBottom).toContainElement(sourcesSection);

    for (const source of filterWhereToGoNextFollowUpLinks(AZURE_BOARDS_INTEGRATION_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
