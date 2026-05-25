import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-config", () => ({
  AUTH_MODE: "development-bypass",
}));

vi.mock("@/lib/oidc/config", () => ({
  isJwtAuthMode: () => false,
}));

vi.mock("@/lib/oidc/session", () => ({
  isLikelySignedIn: () => false,
}));

vi.mock("@/lib/team-expansion-nudge-telemetry", () => ({
  recordTeamExpansionNudgeShown: vi.fn(),
  recordTeamExpansionNudgeClicked: vi.fn(),
}));

import { recordTeamExpansionNudgeClicked, recordTeamExpansionNudgeShown } from "@/lib/team-expansion-nudge-telemetry";
import { TeamExpansionNudge } from "@/components/TeamExpansionNudge";

const mockShown = vi.mocked(recordTeamExpansionNudgeShown);
const mockClicked = vi.mocked(recordTeamExpansionNudgeClicked);

describe("TeamExpansionNudge", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_OPERATOR_EXPERIENCE", "operator");
    sessionStorage.clear();
    localStorage.clear();
    mockShown.mockClear();
    mockClicked.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    sessionStorage.clear();
    localStorage.clear();
  });

  it("does not render for trial tenants", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            isTrial: true,
            commercialTier: null,
            seatsUsed: 4,
            seatsLimit: 5,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );

    render(<TeamExpansionNudge />);

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("team-expansion-nudge")).not.toBeInTheDocument();
  });

  it("renders workspace trigger and links to pricing with team-expansion query params", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            isTrial: false,
            commercialTier: "Team",
            workspacesUsed: 1,
            workspacesLimit: 1,
            seatsUsed: 2,
            seatsLimit: 5,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );

    render(<TeamExpansionNudge />);

    await waitFor(() => {
      expect(screen.getByTestId("team-expansion-nudge")).toBeInTheDocument();
    });

    expect(screen.getByTestId("team-expansion-nudge")).toHaveAttribute("data-trigger", "workspaces");
    expect(screen.getByRole("link", { name: /request a quote/i })).toHaveAttribute(
      "href",
      "/pricing?source=team-expansion&trigger=workspaces#pricing-quote-request",
    );
    expect(mockShown).toHaveBeenCalledWith("workspaces");
  });

  it("does not render for Professional tenants", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            isTrial: false,
            commercialTier: "Professional",
            seatsUsed: 18,
            seatsLimit: 20,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );

    render(<TeamExpansionNudge />);

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("team-expansion-nudge")).not.toBeInTheDocument();
  });

  it("dismiss snoozes for 24 hours and records click telemetry", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            isTrial: false,
            commercialTier: "Team",
            seatsUsed: 4,
            seatsLimit: 5,
            workspacesUsed: 1,
            workspacesLimit: 1,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );

    render(<TeamExpansionNudge />);

    await waitFor(() => {
      expect(screen.getByTestId("team-expansion-nudge")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("link", { name: /request a quote/i }));
    expect(mockClicked).toHaveBeenCalledWith("workspaces");

    fireEvent.click(screen.getByRole("button", { name: /dismiss team expansion nudge for 24 hours/i }));

    await waitFor(() => {
      expect(screen.queryByTestId("team-expansion-nudge")).not.toBeInTheDocument();
    });

    expect(localStorage.getItem("archlucid_team_expansion_nudge_dismiss_until_workspaces")).not.toBeNull();
  });
});
