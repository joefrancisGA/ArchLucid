import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ServiceBusHealthBanner } from "./ServiceBusHealthBanner";

const originalFetch = globalThis.fetch;

describe("ServiceBusHealthBanner", () => {
  beforeEach(() => {
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
    globalThis.fetch = originalFetch;
  });

  it("renders nothing when azure_service_bus is Healthy", async () => {
    render(<ServiceBusHealthBanner />);

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

    render(<ServiceBusHealthBanner />);

    await waitFor(() => {
      expect(screen.getByTestId("service-bus-health-degraded-banner")).toBeInTheDocument();
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/azure service bus messaging is degraded/i);
  });
});