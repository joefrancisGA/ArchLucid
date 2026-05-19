import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DataArchivalDegradedBanner } from "./DataArchivalDegradedBanner";

const originalFetch = globalThis.fetch;

describe("DataArchivalDegradedBanner", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes("/api/proxy/health/ready")) {
        return new Response(
          JSON.stringify({
            status: "Healthy",
            entries: [{ name: "data_archival", status: "Healthy" }],
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

  it("renders nothing when data_archival is Healthy", async () => {
    render(<DataArchivalDegradedBanner />);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("governance-dashboard-data-archival-degraded")).not.toBeInTheDocument();
  });

  it("renders nothing when data_archival check is absent", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes("/api/proxy/health/ready")) {
        return new Response(
          JSON.stringify({
            status: "Healthy",
            entries: [{ name: "database", status: "Healthy" }],
          }),
          { status: 200 },
        );
      }

      return new Response("not found", { status: 404 });
    }) as unknown as typeof fetch;

    render(<DataArchivalDegradedBanner />);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("governance-dashboard-data-archival-degraded")).not.toBeInTheDocument();
  });

  it("shows a warning banner when data_archival is Degraded", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes("/api/proxy/health/ready")) {
        return new Response(
          JSON.stringify({
            status: "Degraded",
            entries: [{ name: "data_archival", status: "Degraded" }],
          }),
          { status: 200 },
        );
      }

      return new Response("not found", { status: 404 });
    }) as unknown as typeof fetch;

    render(<DataArchivalDegradedBanner />);

    await waitFor(() => {
      expect(screen.getByTestId("governance-dashboard-data-archival-degraded")).toBeInTheDocument();
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/data retention archival is degraded/i);
    expect(screen.getByRole("link", { name: /system health/i })).toHaveAttribute("href", "/admin/health");
  });
});
