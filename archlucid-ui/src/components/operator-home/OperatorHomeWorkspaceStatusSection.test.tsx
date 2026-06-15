import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorHomeWorkspaceStatusSection } from "@/components/operator-home/OperatorHomeWorkspaceStatusSection";

const originalFetch = globalThis.fetch;

describe("OperatorHomeWorkspaceStatusSection", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes("/api/proxy/health/ready")) {
        return new Response(JSON.stringify({ status: "Degraded", entries: [] }), { status: 200 });
      }

      if (url.includes("/api/proxy/v1/tenant/roi-baseline")) {
        return new Response(JSON.stringify({ complete: true }), { status: 200 });
      }

      return new Response("not found", { status: 404 });
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("surfaces unhealthy setup health inside workspace status", async () => {
    render(<OperatorHomeWorkspaceStatusSection />);

    await waitFor(() => {
      expect(screen.getByText(/setup needs attention — open troubleshooting/i)).toBeInTheDocument();
    });
  });
});
