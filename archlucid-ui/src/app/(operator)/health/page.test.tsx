import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SystemHealthPage from "./page";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

describe("SystemHealthPage", () => {
  it("renders liveness, readiness dependencies, version, and uptime", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      const s = String(url);

      if (s.includes("health/live")) {
        return jsonResponse({ status: "Healthy" });
      }

      if (s.includes("health/ready")) {
        return jsonResponse({
          status: "Healthy",
          entries: [
            { name: "database", status: "Healthy" },
            { name: "openai", status: "Healthy" },
            { name: "redis", status: "Degraded" },
          ],
        });
      }

      if (s.includes("/version")) {
        return jsonResponse({
          informationalVersion: "9.9.9+test",
          commitSha: "deadbeef",
          processUptimeSeconds: 3661,
        });
      }

      return new Response("n", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<SystemHealthPage />);

    await waitFor(() => {
      expect(screen.getByTestId("system-health-dependencies-table")).toBeInTheDocument();
    });

    expect(screen.getByText("SQL Server")).toBeInTheDocument();
    expect(screen.getByText("Azure OpenAI")).toBeInTheDocument();
    expect(screen.getByText("Redis")).toBeInTheDocument();
    expect(screen.getByText("9.9.9+test")).toBeInTheDocument();
    expect(screen.getByTestId("system-health-uptime")).toHaveTextContent("1h 1m");
    expect(screen.getByText(/GET \/health\/live/)).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
