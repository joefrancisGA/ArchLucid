import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const fetchItsmIntegrationHealth = vi.fn();

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  fetchItsmIntegrationHealth: (...args: unknown[]) => fetchItsmIntegrationHealth(...args),
}));

import { AdminItsmConnectorsPageClient } from "./AdminItsmConnectorsPageClient";

describe("AdminItsmConnectorsPageClient", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders system-admin-only ITSM scope and loads Jira and ServiceNow health", async () => {
    fetchItsmIntegrationHealth.mockResolvedValue({
      nativeEnabled: false,
      jira: { locallyConfigured: true, reachable: true, summary: "Jira Cloud settings populated." },
      serviceNow: { locallyConfigured: false, summary: "Add ServiceNow instance URL." },
    });

    render(<AdminItsmConnectorsPageClient />);

    expect(screen.getByTestId("admin-itsm-connectors-page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ITSM connectors" })).toBeInTheDocument();
    expect(screen.getByText("System admin only")).toBeInTheDocument();
    expect(screen.getByText(/TB-404/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Integration readiness" })).toHaveAttribute(
      "href",
      "/integrations/operations",
    );

    await waitFor(() => {
      expect(screen.getByTestId("admin-itsm-jira-health")).toHaveTextContent("Jira Cloud settings populated.");
    });

    expect(screen.getByTestId("admin-itsm-servicenow-health")).toHaveTextContent("Add ServiceNow instance URL.");
  });
});
