import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { writeOperatorScopeToStorage } from "@/lib/operator/operator-scope-storage";

import { PlanningBridgePanel } from "./PlanningBridgePanel";

const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const workspaceId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const projectId = "cccccccc-cccc-cccc-cccc-cccccccccccc";

describe("PlanningBridgePanel (TB-879)", () => {
  beforeEach(() => {
    writeOperatorScopeToStorage({ tenantId, workspaceId, projectId });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards operator scope headers when materializing planning drafts", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        themesInserted: 1,
        plansInserted: 1,
        skippedExistingThemeKeys: 0,
        signalLinksInserted: 0,
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<PlanningBridgePanel since={null} disabled={false} />);

    fireEvent.click(screen.getByRole("button", { name: /create draft plans/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const materializeCall = fetchMock.mock.calls[0];
    expect(String(materializeCall[0])).toContain("/api/proxy/v1/learning/planning/materialize");

    const headers = new Headers((materializeCall[1] as RequestInit | undefined)?.headers);
    expect(headers.get("x-tenant-id")).toBe(tenantId);
    expect(headers.get("x-workspace-id")).toBe(workspaceId);
    expect(headers.get("x-project-id")).toBe(projectId);
  });

  it("surfaces retrieval citations from materialize response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        themesInserted: 1,
        plansInserted: 1,
        skippedExistingThemeKeys: 0,
        signalLinksInserted: 2,
        retrievalCitations: [
          {
            signalId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            themeKey: "pattern:api-gateway",
            snippet: "Prior pilot signal about gateway latency",
          },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<PlanningBridgePanel since={null} disabled={false} />);

    fireEvent.click(screen.getByRole("button", { name: /create draft plans/i }));

    await waitFor(() => {
      expect(screen.getByTestId("planning-bridge-retrieval-citations")).toBeInTheDocument();
    });

    expect(screen.getByText(/pattern:api-gateway/i)).toBeInTheDocument();
    expect(screen.getByText(/gateway latency/i)).toBeInTheDocument();
    expect(screen.getByText(/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/i)).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
