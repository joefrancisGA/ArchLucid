import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ITSM_CONNECTORS_ADMIN_BANNED_SUBSTRINGS } from "@/lib/itsm-connectors-admin-scope";
import { ITSM_CONNECTORS_ADMIN_SETTINGS_LOAD_FAILURE_EXPLANATION } from "@/lib/itsm-connectors-admin-page-load";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "..", "..", "..", "..");

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

const fetchItsmIntegrationHealth = vi.fn();
const fetchTenantItsmOutboundSettings = vi.fn();

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  fetchItsmIntegrationHealth: (...args: unknown[]) => fetchItsmIntegrationHealth(...args),
  fetchTenantItsmOutboundSettings: (...args: unknown[]) => fetchTenantItsmOutboundSettings(...args),
  upsertTenantItsmOutboundSettings: vi.fn(),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
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
    expect(screen.getByTestId("admin-itsm-connectors-page-heading")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ITSM connectors", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Integration readiness" })).toHaveAttribute(
      "href",
      "/administration/connection-status",
    );

    await waitFor(() => {
      expect(screen.getByTestId("admin-itsm-onboarding-wizard")).toBeInTheDocument();
    });

    const wizard = screen.getByTestId("admin-itsm-onboarding-wizard");
    const scope = screen.getByTestId("admin-itsm-connectors-scope");
    expect(wizard.compareDocumentPosition(scope) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

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

  it("renders without appsettings keys or V1-window chrome (TB-1430)", async () => {
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
      expect(screen.getByTestId("admin-itsm-connectors-scope")).toBeInTheDocument();
    });

    expect(screen.getByText("What this page configures")).toBeInTheDocument();
    expect(screen.queryByText("V1 scope")).not.toBeInTheDocument();

    const visible = document.body.textContent ?? "";

    for (const banned of ITSM_CONNECTORS_ADMIN_BANNED_SUBSTRINGS) {
      expect(visible, `rendered copy contains "${banned}"`).not.toContain(banned);
    }
  });

  it("keeps admin ITSM source surfaces free of banned appsettings and V1-window chrome (TB-1430)", () => {
    const adminPage = readRepoFile(
      "archlucid-ui/src/app/(operator)/internal/integrations/itsm/_sections/AdminItsmConnectorsPageClient.tsx",
    );
    const wizard = readRepoFile(
      "archlucid-ui/src/app/(operator)/internal/integrations/itsm/_sections/AdminItsmConnectorOnboardingWizard.tsx",
    );
    const haystack = `${adminPage}\n${wizard}`.toLowerCase();

    for (const banned of ITSM_CONNECTORS_ADMIN_BANNED_SUBSTRINGS) {
      expect(haystack, `source contains "${banned}"`).not.toContain(banned.toLowerCase());
    }
  });

  it("keeps connector health when settings load fails (TB-1431)", async () => {
    fetchItsmIntegrationHealth.mockResolvedValue({
      nativeEnabled: true,
      jira: { locallyConfigured: true, reachable: true, summary: "Jira Cloud settings populated." },
      serviceNow: { locallyConfigured: false, summary: "Add ServiceNow instance URL." },
    });
    fetchTenantItsmOutboundSettings.mockRejectedValue(new Error("Database Query Failed"));

    render(<AdminItsmConnectorsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("admin-itsm-jira-health")).toHaveTextContent("Jira Cloud settings populated.");
    });

    fireEvent.click(screen.getByTestId("admin-itsm-step-prerequisites"));

    await waitFor(() => {
      expect(screen.getByTestId("admin-itsm-step-panel-prerequisites")).toBeInTheDocument();
    });

    expect(screen.getByTestId("admin-itsm-onboarding-wizard")).toBeInTheDocument();
    expect(screen.getByTestId("admin-itsm-settings-load-error")).toHaveTextContent(
      ITSM_CONNECTORS_ADMIN_SETTINGS_LOAD_FAILURE_EXPLANATION,
    );
    expect(screen.queryByTestId("admin-itsm-health-load-error")).not.toBeInTheDocument();
    expect(
      screen.queryByText("not configured — ask a platform administrator to add Jira credentials"),
    ).not.toBeInTheDocument();
  });

  it("keeps onboarding wizard when health load fails (TB-1431)", async () => {
    fetchItsmIntegrationHealth.mockRejectedValue(new Error("Health probe unavailable"));
    fetchTenantItsmOutboundSettings.mockResolvedValue({
      hasTenantOverrides: true,
      nativeEnabled: true,
      deploymentCredentials: {
        jiraConfigured: true,
        jiraServiceAccountEmailMasked: "a***n@example.com",
        serviceNowConfigured: false,
      },
    });

    render(<AdminItsmConnectorsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("admin-itsm-onboarding-wizard")).toBeInTheDocument();
    });

    expect(screen.getByTestId("admin-itsm-health-load-error")).toHaveTextContent("Health probe unavailable");
    expect(screen.getByText("Tenant ITSM outbound overrides are saved for this tenant.")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-itsm-settings-load-error")).not.toBeInTheDocument();
  });

  it("shows skeleton while loading and page-level refresh control (TB-1432)", async () => {
    fetchItsmIntegrationHealth.mockImplementation(() => new Promise(() => undefined));
    fetchTenantItsmOutboundSettings.mockImplementation(() => new Promise(() => undefined));

    render(<AdminItsmConnectorsPageClient />);

    expect(screen.getByTestId("admin-itsm-connectors-loading-skeleton")).toBeInTheDocument();
    expect(screen.queryByText(/Loading connector configuration/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("admin-itsm-connectors-refresh")).toHaveTextContent("Refreshing…");
  });

  it("promotes Retry when load errors are present (TB-1432)", async () => {
    fetchItsmIntegrationHealth.mockRejectedValue(new Error("Database Query Failed"));
    fetchTenantItsmOutboundSettings.mockRejectedValue(new Error("Database Query Failed"));

    render(<AdminItsmConnectorsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("admin-itsm-connectors-refresh")).toHaveTextContent("Retry");
    });

    expect(screen.getByTestId("admin-itsm-health-load-error")).toBeInTheDocument();
    expect(screen.getByTestId("admin-itsm-settings-load-error")).toBeInTheDocument();
    expect(screen.queryByText(/Database Query Failed/i)).not.toBeInTheDocument();
  });

  it("keeps wizard mounted while refreshing after initial load (TB-1432)", async () => {
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

    await waitFor(() => {
      expect(screen.getByTestId("admin-itsm-onboarding-wizard")).toBeInTheDocument();
    });

    fetchItsmIntegrationHealth.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                nativeEnabled: true,
                jira: { locallyConfigured: true, reachable: true, summary: "Jira Cloud settings populated." },
                serviceNow: { locallyConfigured: false, summary: "Add ServiceNow instance URL." },
              }),
            50,
          );
        }),
    );

    fireEvent.click(screen.getByTestId("admin-itsm-connectors-refresh"));

    expect(screen.getByTestId("admin-itsm-onboarding-wizard")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-itsm-connectors-loading-skeleton")).not.toBeInTheDocument();
  });

  it("points smoke runbooks at product integrations and readiness, not troubleshooting (TB-1433)", async () => {
    fetchItsmIntegrationHealth.mockResolvedValue({
      nativeEnabled: true,
      jira: { locallyConfigured: true, reachable: true, summary: "ready" },
      serviceNow: { locallyConfigured: false, summary: "missing" },
    });
    fetchTenantItsmOutboundSettings.mockResolvedValue({
      hasTenantOverrides: false,
      nativeEnabled: true,
      deploymentCredentials: {
        jiraConfigured: true,
        serviceNowConfigured: false,
      },
    });

    render(<AdminItsmConnectorsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("admin-itsm-onboarding-wizard")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("admin-itsm-step-runbooks"));

    await waitFor(() => {
      expect(screen.getByTestId("admin-itsm-step-panel-runbooks")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: "Jira connector smoke checklist" })).toHaveAttribute(
      "href",
      "/integrations/jira",
    );
    expect(screen.getByRole("link", { name: "ServiceNow connector smoke checklist" })).toHaveAttribute(
      "href",
      "/integrations/servicenow",
    );
    expect(screen.getByRole("link", { name: "ITSM live smoke scaffold" })).toHaveAttribute(
      "href",
      "/administration/connection-status",
    );
    expect(screen.queryByRole("link", { name: /troubleshooting/i })).not.toBeInTheDocument();
  });
});
