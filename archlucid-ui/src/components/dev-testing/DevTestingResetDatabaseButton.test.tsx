import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DevTestingResetDatabaseButton } from "@/components/dev-testing/DevTestingResetDatabaseButton";
import { CORRELATION_ID_HEADER } from "@/lib/correlation";

describe("DevTestingResetDatabaseButton", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ catalogName: "ArchLucid", demoSeedApplied: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          [CORRELATION_ID_HEADER]: "corr-reset-success",
        },
      }),
    );
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders a destructive Reset Database button", () => {
    render(<DevTestingResetDatabaseButton />);

    expect(screen.getByTestId("dev-reset-database-button")).toHaveTextContent("Reset Database");
  });

  it("explains the 10-minute budget and SSMS procedure in the confirm dialog", () => {
    render(<DevTestingResetDatabaseButton />);

    fireEvent.click(screen.getByTestId("dev-reset-database-button"));

    expect(screen.getByText(/up to 10 minutes/i)).toBeInTheDocument();
    expect(screen.getByText(/usp_ArchLucid_ResetDevelopmentCatalog/i)).toBeInTheDocument();
    expect(screen.getByText(/connect to the master database/i)).toBeInTheDocument();
  });

  it("confirms before calling the reset route and shows success telemetry", async () => {
    const assignMock = vi.fn();
    vi.stubGlobal("location", { assign: assignMock });
    const originalSetTimeout = window.setTimeout.bind(window);
    vi.spyOn(window, "setTimeout").mockImplementation((handler, delay, ...args) => {
      if (delay === 1_500) {
        if (typeof handler === "function") {
          handler(...args);
        }

        return 1 as unknown as ReturnType<typeof setTimeout>;
      }

      return originalSetTimeout(handler, delay, ...args);
    });

    render(<DevTestingResetDatabaseButton />);

    fireEvent.click(screen.getByTestId("dev-reset-database-button"));
    fireEvent.click(await screen.findByRole("button", { name: "Reset Database" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/reset-database",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            [CORRELATION_ID_HEADER]: expect.any(String),
          }),
        }),
      );
    });

    expect(await screen.findByTestId("dev-reset-database-status")).toHaveTextContent("Database reset completed.");
    expect(screen.getByText("Catalog:")).toBeInTheDocument();
    expect(screen.getByText("ArchLucid")).toBeInTheDocument();
    expect(screen.getByText("corr-reset-success")).toBeInTheDocument();
    expect(assignMock).toHaveBeenCalledWith("/");
  });

  it("surfaces API failures in the dialog and status panel with admin guidance", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          title: "Forbidden",
          detail: "Admin role required.",
          correlationId: "corr-reset-forbidden",
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/problem+json",
            [CORRELATION_ID_HEADER]: "corr-reset-forbidden",
          },
        },
      ),
    );

    render(<DevTestingResetDatabaseButton />);

    fireEvent.click(screen.getByTestId("dev-reset-database-button"));
    fireEvent.click(await screen.findByRole("button", { name: "Reset Database" }));

    expect(await screen.findByTestId("dev-reset-database-dialog-feedback")).toHaveTextContent("Admin role required.");
    expect(screen.getByTestId("dev-reset-database-status")).toHaveTextContent("Database reset failed.");
    expect(screen.getByText(/Set the dev role override to Admin/i)).toBeInTheDocument();
    expect(screen.getByText("corr-reset-forbidden")).toBeInTheDocument();
  });
});
