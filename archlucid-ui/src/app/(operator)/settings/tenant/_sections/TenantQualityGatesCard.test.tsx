import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TenantQualityGatesCard } from "./TenantQualityGatesCard";

describe("TenantQualityGatesCard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads mode and applies PilotStrict on button click", async () => {
    let effectiveMode: "WarnOnly" | "PilotStrict" = "WarnOnly";
    let source: "HostDefault" | "TenantOverride" = "HostDefault";

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("agent-output-quality-gate-mode") && (!init?.method || init.method === "GET")) {
        return new Response(
          JSON.stringify({ effectiveMode, source, hostDefaultMode: "WarnOnly" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("agent-output-quality-gate-mode") && init?.method === "PUT") {
        effectiveMode = "PilotStrict";
        source = "TenantOverride";

        return new Response(
          JSON.stringify({ effectiveMode, source, hostDefaultMode: "WarnOnly" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("config-summary")) {
        return new Response(JSON.stringify({ keys: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("diagnostics/quality-gates")) {
        return new Response(
          JSON.stringify({
            enabled: true,
            mode: "WarnOnly",
            structuralRejectBelow: 0.7,
            semanticRejectBelow: 0.5,
            pilotStrictMinStructuralCompleteness: 0.9,
            pilotStrictMinSemanticScore: 0.55,
            pilotStrictMinEvidenceRefCount: 2,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<TenantQualityGatesCard />);

    await waitFor(() => {
      expect(screen.getByTestId("quality-gate-mode-controls")).toBeInTheDocument();
      expect(screen.getByTestId("quality-gate-diagnostics-panel")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Pilot strict" }));

    await waitFor(() => {
      const controls = screen.getByTestId("quality-gate-mode-controls");
      expect(within(controls).getByText("PilotStrict")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("agent-output-quality-gate-mode"),
      expect.objectContaining({ method: "PUT" }),
    );
  });
});
