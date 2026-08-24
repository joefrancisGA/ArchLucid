import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DevTestingResetDatabaseButton } from "@/components/dev-testing/DevTestingResetDatabaseButton";

describe("DevTestingResetDatabaseButton", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ catalogName: "ArchLucid", demoSeedApplied: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("renders a destructive Reset Database button", () => {
    render(<DevTestingResetDatabaseButton />);

    expect(screen.getByTestId("dev-reset-database-button")).toHaveTextContent("Reset Database");
  });

  it("confirms before calling the reset route", async () => {
    const assignMock = vi.fn();
    vi.stubGlobal("location", { assign: assignMock });

    render(<DevTestingResetDatabaseButton />);

    fireEvent.click(screen.getByTestId("dev-reset-database-button"));
    fireEvent.click(await screen.findByRole("button", { name: "Reset Database" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/reset-database",
        expect.objectContaining({ method: "POST" }),
      );
    });

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith("/");
    });
  });
});
