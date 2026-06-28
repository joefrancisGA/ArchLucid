import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const fetchItsmIntegrationHealth = vi.fn();
const fetchTenantItsmOutboundSettings = vi.fn();
const fetchTenantItsmConnectorConnection = vi.fn();

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  fetchItsmIntegrationHealth: (...args: unknown[]) => fetchItsmIntegrationHealth(...args),
  fetchTenantItsmOutboundSettings: (...args: unknown[]) => fetchTenantItsmOutboundSettings(...args),
  fetchTenantItsmConnectorConnection: (...args: unknown[]) => fetchTenantItsmConnectorConnection(...args),
  upsertTenantItsmOutboundSettings: vi.fn(),
  upsertTenantItsmConnectorConnection: vi.fn(),
  deleteTenantItsmConnectorConnection: vi.fn(),
}));

import { ItsmIntegrationPageClient } from "./ItsmIntegrationPageClient";

describe("ItsmIntegrationPageClient", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders unified ITSM settings and connector sections", async () => {
    fetchItsmIntegrationHealth.mockResolvedValue({
      nativeEnabled: true,
      jira: { locallyConfigured: true, reachable: true, summary: "Jira ready." },
      serviceNow: { locallyConfigured: false, summary: "ServiceNow not configured." },
    });
    fetchTenantItsmOutboundSettings.mockResolvedValue({
      hasTenantOverrides: true,
      jiraProjectKeyOverride: "ARCH",
      jiraSendInfoSeverity: false,
      serviceNowAutoCreateCmdbCi: false,
    });
    fetchTenantItsmConnectorConnection.mockResolvedValue({ isConfigured: false });

    render(<ItsmIntegrationPageClient />);

    expect(screen.getByTestId("integrations-itsm-page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Jira & ServiceNow" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("integrations-itsm-settings")).toBeInTheDocument();
    });

    expect(screen.getByTestId("integrations-itsm-jira-connection")).toBeInTheDocument();
    expect(screen.getByTestId("integrations-itsm-servicenow-connection")).toBeInTheDocument();
    expect(screen.getByLabelText("Jira project key override")).toHaveValue("ARCH");
  });
});
