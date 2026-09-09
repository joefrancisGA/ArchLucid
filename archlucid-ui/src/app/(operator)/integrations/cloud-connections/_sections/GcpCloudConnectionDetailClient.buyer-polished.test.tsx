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

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/integrations/cloud-connections/gcp",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { GcpCloudConnectionDetailClient } from "./GcpCloudConnectionDetailClient";
import {
  GCP_CLOUD_CONNECTION_BUYER_OVERVIEW,
  GCP_CLOUD_CONNECTION_FIRST_VIEWPORT_TEST_ID,
  GCP_CLOUD_CONNECTION_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  GCP_CLOUD_CONNECTION_ORIENTATION_BOTTOM_TEST_ID,
  GCP_CLOUD_CONNECTION_PAGE_LEAD,
  GCP_CLOUD_CONNECTION_PAGE_SUBTITLE_BUYER,
  GCP_CLOUD_CONNECTION_PRIMARY_CONTENT_ID,
  GCP_CLOUD_CONNECTION_SKIP_LINK_LABEL,
  GCP_CLOUD_CONNECTION_SKIP_TARGET_ID,
  GCP_CLOUD_CONNECTION_WORKSPACE_TEST_ID,
} from "./gcp-cloud-connection-page-copy";
import {
  CLOUD_PROVIDER_CONNECTION_CLAIM_DISCIPLINE,
  CLOUD_PROVIDER_CONNECTION_FOLLOW_UPS_TITLE,
  cloudProviderConnectionSources,
} from "@/lib/cloud-provider-connection-evidence-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { filterOrientationSourcesForJobContext } from "@/lib/evidence-orientation/job-context-orientation-sources-filter";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

describe("GcpCloudConnectionDetailClient buyer-polished shell (IGC)", () => {
  it("renders skip link, intro lead, start-here panel before follow-ups, header claim discipline, and hides contextual help", async () => {
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
    const overview = screen.getByTestId("gcp-cloud-connection-overview");
    const workspace = screen.getByTestId(GCP_CLOUD_CONNECTION_WORKSPACE_TEST_ID);
    const providerDetail = screen.getByTestId("cloud-provider-detail-gcp");
    const orientationBottom = screen.getByTestId(GCP_CLOUD_CONNECTION_ORIENTATION_BOTTOM_TEST_ID);
    const sourcesSection = screen.getByTestId("cloud-connections-gcp-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(screen.getByTestId("gcp-cloud-connection-intro")).toHaveTextContent(GCP_CLOUD_CONNECTION_PAGE_LEAD);
    expect(firstViewport).toContainElement(actionPanel);
    expect(firstViewport).not.toContainElement(overview);
    expect(screen.getByTestId("gcp-cloud-connection-overview")).toHaveTextContent(GCP_CLOUD_CONNECTION_BUYER_OVERVIEW);
    expect(primaryContent).toContainElement(overview);
    expect(primaryContent).toContainElement(workspace);
    expect(workspace).toContainElement(providerDetail);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.queryByRole("heading", { level: 2, name: "Overview" })).not.toBeInTheDocument();

    for (const source of filterOrientationSourcesForJobContext(
      filterWhereToGoNextFollowUpLinks(cloudProviderConnectionSources("gcp")),
      "/integrations/cloud-connections/gcp",
    )) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(overview.compareDocumentPosition(workspace) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(workspace.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
