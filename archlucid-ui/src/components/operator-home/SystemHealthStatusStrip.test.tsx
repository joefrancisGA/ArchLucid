import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SystemHealthStatusStrip } from "./SystemHealthStatusStrip";

const originalFetch = globalThis.fetch;

describe("SystemHealthStatusStrip", () => {
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

  it("renders readiness strip", async () => {
    render(<SystemHealthStatusStrip />);

    await waitFor(() => {
      expect(screen.getByTestId("command-center-health-card")).toBeInTheDocument();
    });
    expect(screen.getByText(/platform services:/i)).toBeInTheDocument();
  });

  it("shows data_archival status from readiness payload", async () => {
    render(<SystemHealthStatusStrip />);

    await waitFor(() => {
      expect(screen.getByTestId("command-center-data-archival-health")).toBeInTheDocument();
    });
    expect(screen.getByText(/data archival:/i)).toBeInTheDocument();
  });

  it("shows explicit warning label when data_archival is Degraded", async () => {
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

    render(<SystemHealthStatusStrip />);

    await waitFor(() => {
      expect(screen.getByText(/\(warning\)/i)).toBeInTheDocument();
    });
  });
});
