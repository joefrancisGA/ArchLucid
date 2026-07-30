import { render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ITSM_CONNECTORS_ADMIN_BANNED_SUBSTRINGS } from "@/lib/itsm-connectors-admin-scope";

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
      "/integrations/readiness",
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
      "archlucid-ui/src/app/(operator)/admin/integrations/itsm/_sections/AdminItsmConnectorsPageClient.tsx",
    );
    const wizard = readRepoFile(
      "archlucid-ui/src/app/(operator)/admin/integrations/itsm/_sections/AdminItsmConnectorOnboardingWizard.tsx",
    );
    const haystack = `${adminPage}\n${wizard}`.toLowerCase();

    for (const banned of ITSM_CONNECTORS_ADMIN_BANNED_SUBSTRINGS) {
      expect(haystack, `source contains "${banned}"`).not.toContain(banned.toLowerCase());
    }
  });
});
