import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

const listTier2Connections = vi.fn(async () => []);
const listAwsTier2Connections = vi.fn(async () => []);
const listGcpTier2Connections = vi.fn(async () => []);

vi.mock("@/lib/api/cloud-connections-api", () => ({
  listTier2Connections: (...args: unknown[]) => listTier2Connections(...args),
  configureTier2Connection: vi.fn(),
  validateTier2ConnectionHostedRun: vi.fn(),
}));

vi.mock("@/lib/api/aws-cloud-connections-api", () => ({
  listAwsTier2Connections: (...args: unknown[]) => listAwsTier2Connections(...args),
  configureAwsTier2Connection: vi.fn(),
  disconnectAwsTier2Connection: vi.fn(),
  triggerAwsTier2HostedRun: vi.fn(),
}));

vi.mock("@/lib/api/gcp-cloud-connections-api", () => ({
  listGcpTier2Connections: (...args: unknown[]) => listGcpTier2Connections(...args),
  configureGcpTier2Connection: vi.fn(),
  disconnectGcpTier2Connection: vi.fn(),
  triggerGcpTier2HostedRun: vi.fn(),
}));

import { CloudConnectionsPageClient } from "./CloudConnectionsPageClient";
import {
  CLOUD_CONNECTIONS_PAGE_FIRST_VIEWPORT_TEST_ID,
  CLOUD_CONNECTIONS_PAGE_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  CLOUD_CONNECTIONS_PAGE_PRIMARY_CONTENT_ID,
  CLOUD_CONNECTIONS_PAGE_SKIP_LINK_LABEL,
  CLOUD_CONNECTIONS_PAGE_SKIP_TARGET_ID,
  CLOUD_CONNECTIONS_PAGE_SUBTITLE_BUYER,
} from "./cloud-connections-page-copy";
import {
  CLOUD_CONNECTIONS_CLAIM_DISCIPLINE,
  CLOUD_CONNECTIONS_FOLLOW_UPS_TITLE,
  CLOUD_CONNECTIONS_SOURCES,
} from "@/lib/cloud-connections-evidence-copy";
import { CLOUD_CONNECTIONS_PAGE_SUBTITLE } from "@/lib/cloud-connections-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { resetCloudPlatformScopeSessionStateForTests } from "@/lib/cloud-platform-scope-storage";

describe("CloudConnectionsPageClient buyer-polished shell (SCE)", () => {
  afterEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    resetCloudPlatformScopeSessionStateForTests();
  });

  it("renders skip link, start-here panel before follow-ups, header claim discipline, and hides operator chrome", async () => {
    render(<CloudConnectionsPageClient />);

    expect(await screen.findByTestId("cloud-connection-card-aws")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: CLOUD_CONNECTIONS_PAGE_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${CLOUD_CONNECTIONS_PAGE_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(CLOUD_CONNECTIONS_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(CLOUD_CONNECTIONS_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId(CLOUD_CONNECTIONS_PAGE_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      CLOUD_CONNECTIONS_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("cloud-connections-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("cloud-connections-hub-vocabulary-disclosure")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: CLOUD_CONNECTIONS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("cloud-connections-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(CLOUD_CONNECTIONS_PAGE_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(CLOUD_CONNECTIONS_PAGE_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("cloud-connections-action-panel");
    const orientationBottom = screen.getByTestId("cloud-connections-orientation-bottom");
    const sourcesSection = screen.getByTestId("cloud-connections-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport).toContainElement(actionPanel);
    expect(orientationBottom).toContainElement(sourcesSection);

    for (const source of filterWhereToGoNextFollowUpLinks(CLOUD_CONNECTIONS_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
