import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ runId: "later-run", setRunId: vi.fn() }),
}));

vi.mock("@/hooks/use-run-detail-workspace-context-bundle-query", () => ({
  useRunDetailWorkspaceContextBundleQuery: () => ({
    data: { priorCommittedRunId: "prior-run" },
  }),
}));

import { CompareNaturalPairSuggestion } from "./CompareNaturalPairSuggestion";

describe("CompareNaturalPairSuggestion", () => {
  it("applies prior vs workspace active review pair", () => {
    const onApplyPair = vi.fn();

    render(<CompareNaturalPairSuggestion leftRunId="" rightRunId="" onApplyPair={onApplyPair} />);

    fireEvent.click(screen.getByTestId("compare-natural-pair-apply"));

    expect(onApplyPair).toHaveBeenCalledWith("prior-run", "later-run");
  });
});
