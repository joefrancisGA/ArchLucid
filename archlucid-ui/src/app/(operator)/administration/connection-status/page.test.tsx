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
  it("renders operational intro and contextual help without duplicate orientation rails", () => {
    render(<AdministrationConnectionStatusPage />);

    expect(
      screen.getByRole("heading", { name: OPERATOR_NAV_LINK_LABELS.integrationReadiness }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/See which integrations are ready, recommended, or optional for this workspace/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("connection-status-related-surfaces")).toHaveTextContent("Related:");
    expect(screen.getByRole("link", { name: "Cloud connections" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Webhooks" })).toBeInTheDocument();
    expect(screen.queryByTestId("connection-status-cloud-connections-vocabulary")).toBeNull();
    expect(screen.queryByTestId("connection-status-webhooks-vocabulary")).toBeNull();
    expect(screen.queryByRole("link", { name: "How integration readiness works" })).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByTestId("connection-status-sources")).toBeNull();
    expect(screen.queryByTestId("connection-status-claim-discipline")).toBeNull();
    expect(screen.queryByText("About integration readiness")).not.toBeInTheDocument();
    expect(screen.getByTestId("connector-operations-dashboard")).toBeInTheDocument();
  });

  it("exposes honest route metadata on the Administration hub", () => {
    expect(ADMINISTRATION_CONNECTION_STATUS_ROUTE_METADATA.title).toBe("Connection status");
    expect(ADMINISTRATION_CONNECTION_STATUS_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(ADMINISTRATION_CONNECTION_STATUS_PATH).toBe("/administration/connection-status");
  });
});
