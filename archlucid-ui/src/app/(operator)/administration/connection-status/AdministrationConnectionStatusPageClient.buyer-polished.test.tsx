import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionDeskChrome: () => false,
  useProductionEvalChrome: () => true,
}));

vi.mock("@/components/integrations/ConnectorOperationsDashboard", () => ({
  ConnectorOperationsDashboard: () => <div data-testid="connector-operations-dashboard" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration/connection-status",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

import { AdministrationConnectionStatusPageClient } from "@/app/(operator)/administration/connection-status/AdministrationConnectionStatusPageClient";
import {
  ADMINISTRATION_CONNECTION_STATUS_FIRST_VIEWPORT_TEST_ID,
  ADMINISTRATION_CONNECTION_STATUS_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  ADMINISTRATION_CONNECTION_STATUS_PAGE_SUBTITLE_BUYER,
  ADMINISTRATION_CONNECTION_STATUS_PAGE_SUBTITLE_OPERATOR,
  ADMINISTRATION_CONNECTION_STATUS_PRIMARY_CONTENT_ID,
  ADMINISTRATION_CONNECTION_STATUS_SKIP_LINK_LABEL,
  ADMINISTRATION_CONNECTION_STATUS_SKIP_TARGET_ID,
  ADMINISTRATION_CONNECTION_STATUS_BUYER_START_HERE_HELPER,
  ADMINISTRATION_CONNECTION_STATUS_PAGE_LEAD,
  ADMINISTRATION_CONNECTION_STATUS_START_HERE_CARD_TITLE,
} from "@/lib/administration-connection-status-page-copy";
import {
  CONNECTION_STATUS_CLAIM_DISCIPLINE,
  CONNECTION_STATUS_FOLLOW_UPS_TITLE,
  CONNECTION_STATUS_SOURCES,
} from "@/lib/connection-status-evidence-copy";
import { whereToGoNextFollowUpLinksForTests } from "@/lib/claim-discipline-test-helpers";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { ADMINISTRATION_CONNECTION_STATUS_PATH } from "@/lib/integrations-nav-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

describe("AdministrationConnectionStatusPageClient buyer-polished shell (ADC)", () => {
  it("renders skip link, dashboard before follow-ups, header claim discipline, and hides contextual help", () => {
    render(<AdministrationConnectionStatusPageClient />);

    expect(screen.getByRole("link", { name: ADMINISTRATION_CONNECTION_STATUS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ADMINISTRATION_CONNECTION_STATUS_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(ADMINISTRATION_CONNECTION_STATUS_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(ADMINISTRATION_CONNECTION_STATUS_PAGE_SUBTITLE_OPERATOR)).not.toBeInTheDocument();
    expect(screen.getByTestId("connection-status-settings-intro")).toHaveTextContent(
      ADMINISTRATION_CONNECTION_STATUS_PAGE_LEAD,
    );
    expect(screen.getByTestId("connection-status-buyer-start-here-helper")).toHaveTextContent(
      ADMINISTRATION_CONNECTION_STATUS_BUYER_START_HERE_HELPER,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: ADMINISTRATION_CONNECTION_STATUS_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByTestId(ADMINISTRATION_CONNECTION_STATUS_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      CONNECTION_STATUS_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("connection-status-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("connection-status-related-surfaces")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: CONNECTION_STATUS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("connection-status-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(ADMINISTRATION_CONNECTION_STATUS_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(ADMINISTRATION_CONNECTION_STATUS_FIRST_VIEWPORT_TEST_ID);
    const dashboard = screen.getByTestId("connector-operations-dashboard");
    const orientationBottom = screen.getByTestId("connection-status-orientation-bottom");
    const sourcesSection = screen.getByTestId("connection-status-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport).toContainElement(dashboard);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(
      screen.getByRole("heading", { name: OPERATOR_NAV_LINK_LABELS.connectionStatus }),
    ).toBeInTheDocument();

    for (const source of whereToGoNextFollowUpLinksForTests(
      CONNECTION_STATUS_SOURCES,
      ADMINISTRATION_CONNECTION_STATUS_PATH,
    )) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

vi.mock("@/components/WorkspaceModeProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/WorkspaceModeProvider")>();
  const guidedWorkspace = {
    mode: "guided" as const,
    mounted: true,
    accountSyncState: "synced" as const,
    isWorkingMode: false,
    setAndPersist: vi.fn(),
  };

  return {
    ...actual,
    useWorkspaceMode: () => guidedWorkspace,
    useWorkspaceModeOrDefault: () => guidedWorkspace,
  };
});


