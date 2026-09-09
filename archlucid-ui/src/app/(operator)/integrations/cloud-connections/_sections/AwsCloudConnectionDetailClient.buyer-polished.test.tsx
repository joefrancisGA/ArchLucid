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

vi.mock("./AwsConnectionSection", () => ({
  AwsConnectionSection: () => <div data-testid="aws-connection-section-stub" />,
}));

vi.mock("./AwsConnectionValidatePanel", () => ({
  AwsConnectionValidatePanel: () => <div data-testid="aws-connection-validate-panel" />,
}));

vi.mock("./AwsConnectionRecentActivityPanel", () => ({
  AwsConnectionRecentActivityPanel: () => <div data-testid="aws-connection-recent-activity-panel" />,
}));

vi.mock("./CloudSecurityPreflightPanel", () => ({
  CloudSecurityPreflightPanel: () => <div data-testid="aws-preflight-stub" />,
  CloudSecurityPreflightTechnicalDetails: ({ children }: { children: ReactNode }) => (
    <div data-testid="aws-technical-details-stub">{children}</div>
  ),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/api/aws-cloud-connections-api", () => ({
  listAwsTier2Connections: vi.fn(async () => []),
  triggerAwsTier2HostedRun: vi.fn(),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { AwsCloudConnectionDetailClient } from "./AwsCloudConnectionDetailClient";
import {
  AWS_CLOUD_CONNECTION_BUYER_OVERVIEW,
  AWS_CLOUD_CONNECTION_FIRST_VIEWPORT_TEST_ID,
  AWS_CLOUD_CONNECTION_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  AWS_CLOUD_CONNECTION_ORIENTATION_BOTTOM_TEST_ID,
  AWS_CLOUD_CONNECTION_PAGE_LEAD,
  AWS_CLOUD_CONNECTION_PAGE_SUBTITLE_BUYER,
  AWS_CLOUD_CONNECTION_PRIMARY_CONTENT_ID,
  AWS_CLOUD_CONNECTION_SKIP_LINK_LABEL,
  AWS_CLOUD_CONNECTION_SKIP_TARGET_ID,
  AWS_CLOUD_CONNECTION_WORKSPACE_TEST_ID,
} from "./aws-cloud-connection-page-copy";
import {
  CLOUD_PROVIDER_CONNECTION_CLAIM_DISCIPLINE,
  CLOUD_PROVIDER_CONNECTION_FOLLOW_UPS_TITLE,
  cloudProviderConnectionSources,
} from "@/lib/cloud-provider-connection-evidence-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

describe("AwsCloudConnectionDetailClient buyer-polished shell (INC)", () => {
  it("renders skip link, intro lead, start-here panel before follow-ups, header claim discipline, and hides contextual help", async () => {
    render(<AwsCloudConnectionDetailClient />);

    await waitFor(() => {
      expect(screen.getByTestId("aws-connection-header-status")).toHaveTextContent("Not connected");
    });

    expect(screen.getByRole("link", { name: AWS_CLOUD_CONNECTION_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${AWS_CLOUD_CONNECTION_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(AWS_CLOUD_CONNECTION_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId(AWS_CLOUD_CONNECTION_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      CLOUD_PROVIDER_CONNECTION_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("cloud-connections-aws-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: CLOUD_PROVIDER_CONNECTION_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("cloud-connections-aws-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(AWS_CLOUD_CONNECTION_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(AWS_CLOUD_CONNECTION_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("aws-cloud-connection-action-panel");
    const overview = screen.getByTestId("aws-cloud-connection-overview");
    const workspace = screen.getByTestId(AWS_CLOUD_CONNECTION_WORKSPACE_TEST_ID);
    const providerDetail = screen.getByTestId("cloud-provider-detail-aws");
    const orientationBottom = screen.getByTestId(AWS_CLOUD_CONNECTION_ORIENTATION_BOTTOM_TEST_ID);
    const sourcesSection = screen.getByTestId("cloud-connections-aws-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(screen.getByTestId("aws-cloud-connection-intro")).toHaveTextContent(AWS_CLOUD_CONNECTION_PAGE_LEAD);
    expect(firstViewport).toContainElement(actionPanel);
    expect(firstViewport).not.toContainElement(overview);
    expect(screen.getByTestId("aws-cloud-connection-overview")).toHaveTextContent(AWS_CLOUD_CONNECTION_BUYER_OVERVIEW);
    expect(primaryContent).toContainElement(overview);
    expect(primaryContent).toContainElement(workspace);
    expect(workspace).toContainElement(providerDetail);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.queryByRole("heading", { level: 2, name: "Overview" })).not.toBeInTheDocument();

    for (const source of filterWhereToGoNextFollowUpLinks(cloudProviderConnectionSources("aws"))) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(overview.compareDocumentPosition(workspace) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(workspace.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
