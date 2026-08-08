import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdministrationConnectionStatusPage from "@/app/(operator)/administration/connection-status/page";
import { ADMINISTRATION_CONNECTION_STATUS_ROUTE_METADATA } from "@/lib/administration-connection-status-route-metadata";
import { ADMINISTRATION_CONNECTION_STATUS_PATH } from "@/lib/integrations-nav-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

vi.mock("@/components/integrations/ConnectorOperationsDashboard", () => ({
  ConnectorOperationsDashboard: () => <div data-testid="connector-operations-dashboard" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

describe("AdministrationConnectionStatusPage (ADC)", () => {
  it("renders operational intro and contextual help without inline layer guidance", () => {
    render(<AdministrationConnectionStatusPage />);

    expect(
      screen.getByRole("heading", { name: OPERATOR_NAV_LINK_LABELS.integrationReadiness }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/which notification, ticketing, publishing, and delivery integrations are configured/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "How integration readiness works" })).toHaveAttribute(
      "href",
      "/help/integration-readiness",
    );
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByTestId("connection-status-sources")).toBeNull(); // TB-2092
    expect(screen.queryByTestId("connection-status-claim-discipline")).toBeNull(); // TB-2092
    expect(screen.queryByText("About integration readiness")).not.toBeInTheDocument();
    expect(screen.getByTestId("connector-operations-dashboard")).toBeInTheDocument();
  });

  it("exposes honest route metadata on the Administration hub", () => {
    expect(ADMINISTRATION_CONNECTION_STATUS_ROUTE_METADATA.title).toBe("Connection status");
    expect(ADMINISTRATION_CONNECTION_STATUS_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(ADMINISTRATION_CONNECTION_STATUS_PATH).toBe("/administration/connection-status");
  });
});
