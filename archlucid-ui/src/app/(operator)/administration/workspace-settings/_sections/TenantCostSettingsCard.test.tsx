import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithOperatorQuery } from "@/testing/operator-query-test-helpers";

import { TenantCostSettingsCard } from "@/app/(operator)/administration/workspace-settings/_sections/TenantCostSettingsCard";
import {
  TENANT_COST_SETTINGS_AUDIT_HREF,
  TENANT_COST_SETTINGS_DEFAULTS_STATUS_LABEL,
} from "@/lib/tenant-settings-page-copy";

vi.mock("@/lib/demo-ui-env", () => ({
  isNextPublicDemoMode: () => false,
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
}));

import { showError } from "@/lib/toast";

describe("TenantCostSettingsCard", () => {
  it("disables Save and shows inline errors for invalid values without validation toast (TB-2008)", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/v1/tenant/cost-settings")) {
        return new Response(
          JSON.stringify({
            isTenantConfigured: false,
            architectHourlyRateUsd: 150,
            averageIncidentCostUsd: 25000,
            eaDiscountPercentage: 0,
            updatedUtc: null,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    renderWithOperatorQuery(<TenantCostSettingsCard canEdit />);

    await waitFor(() => {
      expect(screen.getByTestId("tenant-cost-settings-save")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("tenant-cost-hourly-rate"), { target: { value: "0" } });

    expect(screen.getByTestId("tenant-cost-settings-save")).toBeDisabled();
    expect(screen.getByText("Enter a USD amount greater than zero.")).toBeInTheDocument();
    expect(showError).not.toHaveBeenCalled();
  });

  it("shows defaults StatusTag, audit trail link after save, and primary submit (P0-3, P0-5, P0-7)", async () => {
    const updatedUtc = "2026-07-08T12:00:00.000Z";
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("/v1/tenant/cost-settings") && init?.method === "PUT") {
        return new Response(
          JSON.stringify({
            isTenantConfigured: true,
            architectHourlyRateUsd: 175,
            averageIncidentCostUsd: 25000,
            eaDiscountPercentage: 0,
            updatedUtc,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("/v1/tenant/cost-settings")) {
        return new Response(
          JSON.stringify({
            isTenantConfigured: false,
            architectHourlyRateUsd: 150,
            averageIncidentCostUsd: 25000,
            eaDiscountPercentage: 0,
            updatedUtc: null,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    renderWithOperatorQuery(<TenantCostSettingsCard canEdit />);

    await waitFor(() => {
      expect(screen.getByTestId("tenant-cost-settings-defaults-status")).toHaveTextContent(
        TENANT_COST_SETTINGS_DEFAULTS_STATUS_LABEL,
      );
      expect(screen.getByTestId("tenant-cost-hourly-rate")).toBeInTheDocument();
    });

    expect(screen.getByTestId("tenant-cost-hourly-rate")).toHaveClass("pl-7");
    expect(screen.getByTestId("tenant-cost-settings-save")).toHaveClass("bg-[var(--al-primary-action-bg)]");

    fireEvent.change(screen.getByTestId("tenant-cost-hourly-rate"), { target: { value: "175" } });
    fireEvent.click(screen.getByTestId("tenant-cost-settings-save"));

    await waitFor(() => {
      expect(screen.getByTestId("tenant-cost-settings-last-changed")).toBeInTheDocument();
    });

    expect(screen.getByTestId("tenant-cost-settings-audit-link")).toHaveAttribute("href", TENANT_COST_SETTINGS_AUDIT_HREF);
    expect(screen.queryByTestId("tenant-cost-settings-defaults-status")).not.toBeInTheDocument();
  });
});
