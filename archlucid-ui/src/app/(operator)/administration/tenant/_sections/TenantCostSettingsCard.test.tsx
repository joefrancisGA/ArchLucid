import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TenantCostSettingsCard } from "@/app/(operator)/administration/tenant/_sections/TenantCostSettingsCard";

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
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<TenantCostSettingsCard canEdit />);

    await waitFor(() => {
      expect(screen.getByTestId("tenant-cost-settings-save")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("tenant-cost-hourly-rate"), { target: { value: "0" } });

    expect(screen.getByTestId("tenant-cost-settings-save")).toBeDisabled();
    expect(screen.getByText("Enter a USD amount greater than zero.")).toBeInTheDocument();
    expect(showError).not.toHaveBeenCalled();
  });
});
