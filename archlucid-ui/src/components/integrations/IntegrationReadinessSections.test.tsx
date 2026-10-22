import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  IntegrationConnectorInventoryTable,
  IntegrationReadinessSummaryStrip,
} from "@/components/integrations/IntegrationReadinessSections";
import { buildIntegrationReadinessSummaryTiles } from "@/lib/connector-readiness-summary";
import type { TenantIntegrationsOperationsDto } from "@/types/operate-rhythm";

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration/connection-status",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

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

describe("IntegrationReadinessSections", () => {
  it("renders workspace scope, refresh, and stale treatment on the summary strip", () => {
    const readAt = new Date("2026-08-12T15:30:00.000Z");
    const staleNow = readAt.getTime() + 6 * 60 * 1000;

    vi.spyOn(Date, "now").mockReturnValue(staleNow);

    render(
      <IntegrationReadinessSummaryStrip
        headline="Core review workflows are ready."
        tiles={buildIntegrationReadinessSummaryTiles(operationsData())}
        configurationReadAt={readAt}
        serverAsOfUtc="2026-08-12T15:30:00.000Z"
        workspaceScopeLabel="Claims Intake"
        refreshing={false}
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByTestId("integration-readiness-workspace-scope")).toHaveTextContent(
      "Workspace scope: Claims Intake",
    );
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.getByTestId("integration-readiness-stale-notice")).toHaveTextContent(/may be stale/i);

    vi.restoreAllMocks();
  });

  it("separates pilot policy tags from configuration status in inventory rows", () => {
    render(
      <IntegrationConnectorInventoryTable
        ariaLabel="Notify the team"
        testId="integration-readiness-table-notifications"
        rows={[
          {
            key: "teams",
            title: "Microsoft Teams",
            policyLabel: "Recommended",
            displayStatus: "Not configured",
            guidance: "Set up a Teams incoming webhook to deliver review notifications to a channel.",
            configurationHref: "/integrations/teams",
            rowActionLabel: "Open setup",
            detailsLabel: "View setup details",
            technicalDetails: "",
            disabledForDeployment: false,
            testId: "connector-card-teams",
          },
        ]}
      />,
    );

    expect(screen.getByLabelText("Pilot policy: Recommended")).toBeInTheDocument();
    expect(screen.getByLabelText("Configuration status: Not configured")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open setup for Microsoft Teams" })).toBeInTheDocument();
  });
});
