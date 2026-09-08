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

vi.mock("./GcpConnectionSection", () => ({
  GcpConnectionSection: () => <div data-testid="gcp-connection-section-stub" />,
}));

vi.mock("./GcpConnectionValidatePanel", () => ({
  GcpConnectionValidatePanel: () => <div data-testid="gcp-connection-validate-panel" />,
}));

vi.mock("./GcpConnectionRecentActivityPanel", () => ({
  GcpConnectionRecentActivityPanel: () => <div data-testid="gcp-connection-recent-activity-panel" />,
}));

vi.mock("./CloudSecurityPreflightPanel", () => ({
  CloudSecurityPreflightPanel: () => <div data-testid="gcp-preflight-stub" />,
  CloudSecurityPreflightTechnicalDetails: ({ children }: { children: ReactNode }) => (
    <div data-testid="gcp-technical-details-stub">{children}</div>
  ),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/api/gcp-cloud-connections-api", () => ({
  listGcpTier2Connections: vi.fn(async () => []),
  configureGcpTier2Connection: vi.fn(),
  disconnectGcpTier2Connection: vi.fn(),
  triggerGcpTier2HostedRun: vi.fn(),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { GcpCloudConnectionDetailClient } from "./GcpCloudConnectionDetailClient";
import {
  GCP_CLOUD_CONNECTION_FIRST_VIEWPORT_TEST_ID,
  GCP_CLOUD_CONNECTION_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  GCP_CLOUD_CONNECTION_PAGE_SUBTITLE_BUYER,
  GCP_CLOUD_CONNECTION_PRIMARY_CONTENT_ID,
  GCP_CLOUD_CONNECTION_SKIP_LINK_LABEL,
  GCP_CLOUD_CONNECTION_SKIP_TARGET_ID,
} from "./gcp-cloud-connection-page-copy";
import {
  CLOUD_PROVIDER_CONNECTION_CLAIM_DISCIPLINE,
  CLOUD_PROVIDER_CONNECTION_FOLLOW_UPS_TITLE,
  cloudProviderConnectionSources,
} from "@/lib/cloud-provider-connection-evidence-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

describe("GcpCloudConnectionDetailClient buyer-polished shell (IGC)", () => {
  it("renders skip link, start-here panel before follow-ups, header claim discipline, and hides contextual help", async () => {
    render(<GcpCloudConnectionDetailClient />);

    await waitFor(() => {
      expect(screen.getByTestId("gcp-connection-header-status")).toHaveTextContent("Not connected");
    });

    expect(screen.getByRole("link", { name: GCP_CLOUD_CONNECTION_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GCP_CLOUD_CONNECTION_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(GCP_CLOUD_CONNECTION_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId(GCP_CLOUD_CONNECTION_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      CLOUD_PROVIDER_CONNECTION_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("cloud-connections-gcp-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: CLOUD_PROVIDER_CONNECTION_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("cloud-connections-gcp-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(GCP_CLOUD_CONNECTION_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(GCP_CLOUD_CONNECTION_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("gcp-cloud-connection-action-panel");
    const orientationBottom = screen.getByTestId("gcp-cloud-connection-orientation-bottom");
    const sourcesSection = screen.getByTestId("cloud-connections-gcp-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport).toContainElement(actionPanel);
    expect(orientationBottom).toContainElement(sourcesSection);

    for (const source of filterWhereToGoNextFollowUpLinks(cloudProviderConnectionSources("gcp"))) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
