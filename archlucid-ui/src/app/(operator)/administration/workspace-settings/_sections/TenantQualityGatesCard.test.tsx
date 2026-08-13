import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithOperatorQuery } from "@/testing/operator-query-test-helpers";

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

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    renderWithOperatorQuery(<TenantQualityGatesCard />);

    await waitFor(() => {
      expect(screen.getByTestId("quality-gate-mode-controls")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Strict quality" }));

    await waitFor(() => {
      const controls = screen.getByTestId("quality-gate-mode-controls");
      expect(within(controls).getByText("Strict quality")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("agent-output-quality-gate-mode"),
      expect.objectContaining({ method: "PUT" }),
    );
  });
});
