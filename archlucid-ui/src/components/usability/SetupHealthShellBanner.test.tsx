import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SetupHealthShellBanner } from "@/components/usability/SetupHealthShellBanner";

const originalFetch = globalThis.fetch;

describe("SetupHealthShellBanner", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes("/api/proxy/health/ready")) {
        return new Response(JSON.stringify({ status: "Degraded", entries: [] }), { status: 200 });
      }

      return new Response("not found", { status: 404 });
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("shows a warning banner when setup is not healthy", async () => {
    render(<SetupHealthShellBanner />);

    await waitFor(() => {
      expect(screen.getByTestId("setup-health-shell-banner")).toBeInTheDocument();
    });
    expect(screen.getByText(/setup needs attention/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open troubleshooting/i })).toHaveAttribute(
      "href",
      "/help/troubleshooting",
    );
  });

  it("hides the banner when setup is healthy", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes("/api/proxy/health/ready")) {
        return new Response(JSON.stringify({ status: "Healthy", entries: [] }), { status: 200 });
      }

      return new Response("not found", { status: 404 });
    }) as unknown as typeof fetch;

    render(<SetupHealthShellBanner />);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("setup-health-shell-banner")).not.toBeInTheDocument();
  });
});
