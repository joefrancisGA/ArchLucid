import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showInfo: vi.fn(),
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 3,
}));

vi.mock("./OperatorBillingManageBillingAction", () => ({
  OperatorBillingManageBillingAction: () => <div data-testid="operator-billing-payment-method-action" />,
}));

import { writeOperatorScopeToStorage } from "@/lib/operator/operator-scope-storage";

import { OperatorBillingWalletPanel } from "./OperatorBillingWalletPanel";

const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const workspaceId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const projectId = "cccccccc-cccc-cccc-cccc-cccccccccccc";

const walletFixture = {
  balanceUsd: 25,
  autoReplenishEnabled: false,
  monthlyCapUsd: 0,
  refillIncrementUsd: 25,
  refillTriggerThresholdUsd: 5,
  autoRefillsThisUtcMonthCount: 0,
  hasPaymentMethod: true,
  rowVersionBase64: "dGVzdA==",
};

describe("OperatorBillingWalletPanel", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    writeOperatorScopeToStorage({ tenantId, workspaceId, projectId });
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      const method = (init as RequestInit | undefined)?.method ?? "GET";

      if (url.includes("/api/proxy/v1/billing/wallet") && method === "GET") {
        return new Response(JSON.stringify(walletFixture), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("/api/proxy/v1/billing/wallet") && method === "PUT") {
        return new Response(
          JSON.stringify({
            ...walletFixture,
            monthlyCapUsd: 50,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return new Response("not found", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards operator scope headers when loading and saving billing wallet", async () => {
    render(<OperatorBillingWalletPanel />);

    await waitFor(() => {
      expect(screen.getByText("Save AI credit settings")).toBeInTheDocument();
    });

    const initialGet = fetchMock.mock.calls.find(
      (call) =>
        String(call[0]).includes("/api/proxy/v1/billing/wallet") &&
        ((call[1] as RequestInit | undefined)?.method ?? "GET") === "GET",
    );
    expect(initialGet).toBeDefined();
    const getHeaders = new Headers((initialGet?.[1] as RequestInit | undefined)?.headers);
    expect(getHeaders.get("x-tenant-id")).toBe(tenantId);
    expect(getHeaders.get("x-workspace-id")).toBe(workspaceId);
    expect(getHeaders.get("x-project-id")).toBe(projectId);

    fireEvent.click(screen.getByRole("combobox", { name: /monthly auto-replenish cap/i }));
    fireEvent.click(await screen.findByRole("option", { name: /\$50 \/ month max/i }));
    fireEvent.click(screen.getByRole("button", { name: /save ai credit settings/i }));

    await waitFor(() => {
      const puts = fetchMock.mock.calls.filter((c) => (c[1] as RequestInit | undefined)?.method === "PUT");
      expect(puts.length).toBeGreaterThan(0);
    });

    const putCall = fetchMock.mock.calls.find((c) => (c[1] as RequestInit | undefined)?.method === "PUT");
    const putHeaders = new Headers((putCall?.[1] as RequestInit | undefined)?.headers);
    expect(putHeaders.get("x-tenant-id")).toBe(tenantId);
    expect(putHeaders.get("x-workspace-id")).toBe(workspaceId);
    expect(putHeaders.get("x-project-id")).toBe(projectId);
  });
});
