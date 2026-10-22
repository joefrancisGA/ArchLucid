import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buyerPolishedShellVitestOverride,
  extendBuyerPolishedShellVitestMock,
} from "@/testing/buyer-polished-shell-vitest-override";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

vi.mock("@/lib/demo-ui-env", async (importOriginal) =>
  extendBuyerPolishedShellVitestMock(importOriginal),
);

import { ServiceBusHealthBanner } from "./ServiceBusHealthBanner";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => false,
  isNextPublicDemoMode: () => false,
}));

vi.mock("@/lib/operator/operator-static-demo", () => ({
  isStaticDemoPayloadFallbackEnabled: () => false,
}));

vi.mock("@/lib/query/operator-query-persist-client", () => ({
  setupOperatorQueryClientPersistence: () => {},
}));

const originalFetch = globalThis.fetch;

describe("ServiceBusHealthBanner", () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetOperatorQueryClientForTests();
    buyerPolishedShellVitestOverride.value = false;
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes("/api/proxy/health/ready")) {
        return new Response(
          JSON.stringify({
            status: "Healthy",
            entries: [{ name: "azure_service_bus", status: "Healthy" }],
          }),
          { status: 200 },
        );
      }

      return new Response("not found", { status: 404 });
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    buyerPolishedShellVitestOverride.value = null;
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it("renders nothing when azure_service_bus is Healthy", async () => {
    renderWithOperatorQuery(<ServiceBusHealthBanner />);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("service-bus-health-degraded-banner")).not.toBeInTheDocument();
  });

  it("shows a warning banner when azure_service_bus is Unhealthy", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes("/api/proxy/health/ready")) {
        return new Response(
          JSON.stringify({
            status: "Unhealthy",
            entries: [{ name: "azure_service_bus", status: "Unhealthy" }],
          }),
          { status: 200 },
        );
      }

      return new Response("not found", { status: 404 });
    }) as unknown as typeof fetch;

    renderWithOperatorQuery(<ServiceBusHealthBanner />);

    await waitFor(() => {
      expect(screen.getByTestId("service-bus-health-degraded-banner")).toBeInTheDocument();
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/review processing is delayed/i);
    expect(screen.getByRole("link", { name: "System health" })).toHaveAttribute(
      "href",
      "/administration/system-health",
    );
    expect(screen.getByText(/azure_service_bus readiness probe/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Internal readiness probe" })).toHaveAttribute(
      "href",
      "/internal/health",
    );
  });

  it("keeps the degraded banner when a later health poll fails", async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (!url.includes("/api/proxy/health/ready")) {
        return new Response("not found", { status: 404 });
      }

      callCount += 1;

      if (callCount === 1) {
        return new Response(
          JSON.stringify({
            status: "Unhealthy",
            entries: [{ name: "azure_service_bus", status: "Unhealthy" }],
          }),
          { status: 200 },
        );
      }

      return new Response("unavailable", { status: 503 });
    }) as unknown as typeof fetch;

    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderWithOperatorQuery(<ServiceBusHealthBanner />);

    await waitFor(() => {
      expect(screen.getByTestId("service-bus-health-degraded-banner")).toBeInTheDocument();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    await waitFor(() => {
      expect(screen.getByTestId("service-bus-health-refresh-failed")).toBeInTheDocument();
    });

    expect(screen.getByTestId("service-bus-health-degraded-banner")).toBeInTheDocument();
    expect(screen.getByText(/Could not refresh processing status/i)).toBeInTheDocument();
  });
});
