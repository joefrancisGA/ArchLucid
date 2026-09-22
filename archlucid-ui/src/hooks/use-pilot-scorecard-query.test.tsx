import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorQueryProvider } from "@/components/operator/OperatorQueryProvider";
import { writeOperatorScopeToStorage } from "@/lib/operator/operator-scope-storage";

vi.mock("@/lib/api/pilots-marketing", () => ({
  getPilotScorecard: vi.fn(),
}));

import { getPilotScorecard } from "@/lib/api/pilots-marketing";

import { usePilotScorecardQuery } from "./use-pilot-scorecard-query";

const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const workspaceA = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const projectA = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const tenantB = "dddddddd-dddd-dddd-dddd-dddddddddddd";

function wrapper({ children }: { children: ReactNode }) {
  return <OperatorQueryProvider>{children}</OperatorQueryProvider>;
}

describe("usePilotScorecardQuery", () => {
  beforeEach(() => {
    writeOperatorScopeToStorage({ tenantId: tenantA, workspaceId: workspaceA, projectId: projectA });
    vi.mocked(getPilotScorecard).mockResolvedValue({ runsCommitted: 1 } as never);
  });

  afterEach(() => {
    vi.mocked(getPilotScorecard).mockReset();
  });

  it("refetches when operator scope changes", async () => {
    const { result, rerender } = renderHook(() => usePilotScorecardQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getPilotScorecard).toHaveBeenCalledTimes(1);

    writeOperatorScopeToStorage({ tenantId: tenantB, workspaceId: workspaceA, projectId: projectA });
    rerender();

    await waitFor(() => expect(getPilotScorecard).toHaveBeenCalledTimes(2));
  });
});
