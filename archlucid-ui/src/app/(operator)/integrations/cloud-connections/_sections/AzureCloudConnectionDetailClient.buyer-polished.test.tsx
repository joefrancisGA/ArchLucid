import { render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("./AzureConnectionDetailsPanel", () => ({
  AzureConnectionDetailsPanel: () => <div data-testid="azure-connection-details-panel-stub" />,
}));

vi.mock("./AzureConnectionValidatePanel", () => ({
  AzureConnectionValidatePanel: () => <div data-testid="azure-connection-validate-panel" />,
}));

vi.mock("./AzureConnectionRecentActivityPanel", () => ({
  AzureConnectionRecentActivityPanel: () => <div data-testid="azure-connection-recent-activity-panel" />,
}));

vi.mock("./CloudSecurityPreflightPanel", () => ({
  CloudSecurityPreflightPanel: () => <div data-testid="azure-preflight-stub" />,
  CloudSecurityPreflightTechnicalDetails: ({ children }: { children: ReactNode }) => (
    <div data-testid="azure-technical-details-stub">{children}</div>
  ),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/api/cloud-connections-api", () => ({
  listTier2Connections: vi.fn(async () => []),
  configureTier2Connection: vi.fn(),
  validateTier2ConnectionHostedRun: vi.fn(),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { AzureCloudConnectionDetailClient } from "./AzureCloudConnectionDetailClient";
import {
  AZURE_CLOUD_CONNECTION_FIRST_VIEWPORT_TEST_ID,
  AZURE_CLOUD_CONNECTION_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  AZURE_CLOUD_CONNECTION_PAGE_SUBTITLE_BUYER,
  AZURE_CLOUD_CONNECTION_PRIMARY_CONTENT_ID,
  AZURE_CLOUD_CONNECTION_SKIP_LINK_LABEL,
  AZURE_CLOUD_CONNECTION_SKIP_TARGET_ID,
} from "./azure-cloud-connection-page-copy";
import {
  CLOUD_PROVIDER_CONNECTION_CLAIM_DISCIPLINE,
  CLOUD_PROVIDER_CONNECTION_FOLLOW_UPS_TITLE,
  cloudProviderConnectionSources,
} from "@/lib/cloud-provider-connection-evidence-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

describe("AzureCloudConnectionDetailClient buyer-polished shell (IAZ)", () => {
  it("renders skip link, start-here panel before follow-ups, header claim discipline, and hides contextual help", async () => {
    render(<AzureCloudConnectionDetailClient />);

    await waitFor(() => {
      expect(screen.getByTestId("azure-connection-header-status")).toHaveTextContent("Not connected");
    });

    expect(screen.getByRole("link", { name: AZURE_CLOUD_CONNECTION_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${AZURE_CLOUD_CONNECTION_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(AZURE_CLOUD_CONNECTION_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId(AZURE_CLOUD_CONNECTION_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      CLOUD_PROVIDER_CONNECTION_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("cloud-connections-azure-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: CLOUD_PROVIDER_CONNECTION_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("cloud-connections-azure-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(AZURE_CLOUD_CONNECTION_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(AZURE_CLOUD_CONNECTION_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("azure-cloud-connection-action-panel");
    const orientationBottom = screen.getByTestId("azure-cloud-connection-orientation-bottom");
    const sourcesSection = screen.getByTestId("cloud-connections-azure-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport).toContainElement(actionPanel);
    expect(orientationBottom).toContainElement(sourcesSection);

    for (const source of filterWhereToGoNextFollowUpLinks(cloudProviderConnectionSources("azure"))) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
