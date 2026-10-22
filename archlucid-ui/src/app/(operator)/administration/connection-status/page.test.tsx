import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

vi.mock("@/components/integrations/ConnectorOperationsDashboard", () => ({
  ConnectorOperationsDashboard: () => <div data-testid="connector-operations-dashboard" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { AdministrationConnectionStatusPageClient } from "@/app/(operator)/administration/connection-status/AdministrationConnectionStatusPageClient";
import { ADMINISTRATION_CONNECTION_STATUS_ROUTE_METADATA } from "@/lib/administration-connection-status-route-metadata";
import {
  ADMINISTRATION_CONNECTION_STATUS_FIRST_VIEWPORT_TEST_ID,
  ADMINISTRATION_CONNECTION_STATUS_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  ADMINISTRATION_CONNECTION_STATUS_PAGE_SUBTITLE_OPERATOR,
} from "@/lib/administration-connection-status-page-copy";
import { ADMINISTRATION_CONNECTION_STATUS_PATH } from "@/lib/integrations-nav-paths";
import { CONNECTION_STATUS_CLAIM_DISCIPLINE } from "@/lib/connection-status-evidence-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { CONNECTION_STATUS_SOURCES } from "@/lib/connection-status-evidence-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

describe("AdministrationConnectionStatusPage (ADC)", () => {
  it("renders operational intro and contextual help without duplicate orientation rails", () => {
    render(<AdministrationConnectionStatusPageClient />);

    expect(
      screen.getByRole("heading", { name: OPERATOR_NAV_LINK_LABELS.connectionStatus }),
    ).toBeInTheDocument();
    expect(screen.getByText(ADMINISTRATION_CONNECTION_STATUS_PAGE_SUBTITLE_OPERATOR)).toBeInTheDocument();
    const relatedSurfaces = screen.getByTestId("connection-status-related-surfaces");

    expect(within(relatedSurfaces).getByRole("link", { name: "Cloud connections" })).toBeInTheDocument();
    expect(within(relatedSurfaces).getByRole("link", { name: "Webhooks" })).toBeInTheDocument();
    expect(screen.queryByTestId("connection-status-cloud-connections-vocabulary")).toBeNull();
    expect(screen.queryByTestId("connection-status-webhooks-vocabulary")).toBeNull();
    expect(screen.queryByRole("link", { name: "How integration readiness works" })).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByTestId("connection-status-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByTestId(ADMINISTRATION_CONNECTION_STATUS_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      CONNECTION_STATUS_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("connection-status-sources")).toBeInTheDocument();
    expect(screen.queryByText("About integration readiness")).not.toBeInTheDocument();
    expect(screen.getByTestId("connector-operations-dashboard")).toBeInTheDocument();

    const firstViewport = screen.getByTestId(ADMINISTRATION_CONNECTION_STATUS_FIRST_VIEWPORT_TEST_ID);
    const dashboard = screen.getByTestId("connector-operations-dashboard");
    const orientationBottom = screen.getByTestId("connection-status-orientation-bottom");

    expect(firstViewport).toContainElement(dashboard);
    expect(
      firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const sourcesSection = screen.getByTestId("connection-status-sources");

    for (const source of filterWhereToGoNextFollowUpLinks(CONNECTION_STATUS_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });

  it("exposes honest route metadata on the Administration hub", () => {
    expect(ADMINISTRATION_CONNECTION_STATUS_ROUTE_METADATA.title).toBe("Connection status");
    expect(ADMINISTRATION_CONNECTION_STATUS_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(ADMINISTRATION_CONNECTION_STATUS_PATH).toBe("/administration/connection-status");
  });
});
