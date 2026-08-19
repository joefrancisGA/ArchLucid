import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConnectorOperationsDashboard } from "@/components/integrations/ConnectorOperationsDashboard";
import { ApiRequestError } from "@/lib/api-request-error";
import type { TenantIntegrationsOperationsDto } from "@/types/operate-rhythm";

vi.mock("@/lib/api", () => ({
  fetchTenantIntegrationsOperations: vi.fn(),
}));

import { fetchTenantIntegrationsOperations } from "@/lib/api";

function operationsData(): TenantIntegrationsOperationsDto {
  return {
    connectors: [
      {
        connectorKey: "teams",
        displayName: "Microsoft Teams",
        isConfigured: false,
        smokeReadiness: "NotConfigured",
        summary: "",
        configurationHref: "/integrations/teams",
      },
      {
        connectorKey: "slack",
        displayName: "Slack",
        isConfigured: false,
        smokeReadiness: "NotConfigured",
        summary: "",
        configurationHref: "/integrations/slack",
      },
      {
        connectorKey: "jira",
        displayName: "Jira",
        isConfigured: false,
        smokeReadiness: "NotConfigured",
        summary: "",
        configurationHref: "/integrations/jira",
      },
    ],
    integrationEventBus: {
      publisherConfigured: false,
      transactionalOutboxEnabled: false,
      consumerConfigured: false,
      usesLegacyConnectionString: false,
      smokeReadiness: "NotConfigured",
    },
  };
}

describe("ConnectorOperationsDashboard", () => {
  beforeEach(() => {
    vi.mocked(fetchTenantIntegrationsOperations).mockReset();
  });

  it("renders retryable failure chrome on 500 and recovers on retry", async () => {
    vi.mocked(fetchTenantIntegrationsOperations)
      .mockRejectedValueOnce(
        new ApiRequestError("Request failed (500 Internal Server Error)", {
          problem: null,
          correlationId: "corr-500",
          httpStatus: 500,
        }),
      )
      .mockResolvedValueOnce(operationsData());

    render(<ConnectorOperationsDashboard />);

    expect(await screen.findByTestId("connection-status-load-failure")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/500 Internal Server Error/i);
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => {
      expect(screen.getByTestId("integration-readiness-summary")).toBeInTheDocument();
    });
    expect(fetchTenantIntegrationsOperations).toHaveBeenCalledTimes(2);
  });

  it("renders a labelled empty state when the read succeeds with no connectors", async () => {
    vi.mocked(fetchTenantIntegrationsOperations).mockResolvedValue({
      connectors: [],
      integrationEventBus: operationsData().integrationEventBus,
    });

    render(<ConnectorOperationsDashboard />);

    expect(await screen.findByTestId("connection-status-empty-state")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/No integrations to show yet/i);
  });

  it("shows integrations connected copy and a single primary setup CTA", async () => {
    vi.mocked(fetchTenantIntegrationsOperations).mockResolvedValue(operationsData());

    render(<ConnectorOperationsDashboard />);

    expect(await screen.findByTestId("integration-readiness-tile-connected")).toHaveTextContent(
      "Integrations connected",
    );
    expect(screen.getByTestId("integration-readiness-tile-connected")).toHaveTextContent(
      /0 of 3 — none required/i,
    );
    expect(screen.getByTestId("integration-readiness-last-checked")).toHaveTextContent(/Configuration read at/i);
    expect(screen.queryByText(/^Last checked:/i)).not.toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Configure Teams notifications" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Configure" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Open setup" }).length).toBeGreaterThan(0);
    expect(screen.queryByLabelText("Status: Ready")).toBeNull();
    expect(screen.getAllByLabelText("Status: Recommended").length).toBeGreaterThan(0);
  });
});
