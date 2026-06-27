import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const fetchItsmIntegrationHealth = vi.fn();
const fetchTenantItsmOutboundSettings = vi.fn();

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  fetchItsmIntegrationHealth: (...args: unknown[]) => fetchItsmIntegrationHealth(...args),
  fetchTenantItsmOutboundSettings: (...args: unknown[]) => fetchTenantItsmOutboundSettings(...args),
  upsertTenantItsmOutboundSettings: vi.fn(),
}));

import { AdminItsmConnectorsPageClient } from "./AdminItsmConnectorsPageClient";

describe("AdminItsmConnectorsPageClient", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders onboarding wizard and loads Jira and ServiceNow health", async () => {
    fetchItsmIntegrationHealth.mockResolvedValue({
      nativeEnabled: true,
      jira: { locallyConfigured: true, reachable: true, summary: "Jira Cloud settings populated." },
      serviceNow: { locallyConfigured: false, summary: "Add ServiceNow instance URL." },
    });
    fetchTenantItsmOutboundSettings.mockResolvedValue({
      hasTenantOverrides: false,
      nativeEnabled: true,
      deploymentCredentials: {
        jiraConfigured: true,
        jiraServiceAccountEmailMasked: "a***n@example.com",
        serviceNowConfigured: false,
      },
    });

    render(<AdminItsmConnectorsPageClient />);

    expect(screen.getByTestId("admin-itsm-connectors-page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ITSM connectors" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Integration readiness" })).toHaveAttribute(
      "href",
      "/integrations/operations",
    );

    await waitFor(() => {
      expect(screen.getByTestId("admin-itsm-onboarding-wizard")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId("admin-itsm-jira-health")).toHaveTextContent("Jira Cloud settings populated.");
    });

    expect(screen.getByTestId("admin-itsm-servicenow-health")).toHaveTextContent("Add ServiceNow instance URL.");
    expect(screen.getByTestId("admin-itsm-step-verify")).toBeInTheDocument();
    expect(screen.getByTestId("admin-itsm-default-path-ready")).toBeInTheDocument();
  });

  it("starts wizard on prerequisites when native create is disabled", async () => {
    fetchItsmIntegrationHealth.mockResolvedValue({
      nativeEnabled: false,
      jira: { locallyConfigured: false, summary: "Not configured." },
      serviceNow: { locallyConfigured: false, summary: "Not configured." },
    });
    fetchTenantItsmOutboundSettings.mockResolvedValue({
      hasTenantOverrides: false,
      nativeEnabled: false,
      deploymentCredentials: {
        jiraConfigured: false,
        serviceNowConfigured: false,
      },
    });

    render(<AdminItsmConnectorsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("admin-itsm-step-panel-prerequisites")).toBeInTheDocument();
    });
  });
});
