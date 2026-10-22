import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GovernanceFindingsQueueQuietEnginesHint } from "./GovernanceFindingsQueueQuietEnginesHint";

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/lib/fetch-run-detail-page-bundle-client", () => ({
  fetchRunDetailCriticalPageBundle: vi.fn(),
}));

vi.mock("@/lib/graph-api", () => ({
  getArchitectureGraphPage: vi.fn(),
}));

import { useQuery } from "@tanstack/react-query";

describe("GovernanceFindingsQueueQuietEnginesHint", () => {
  it("shows quiet-engine copy when analysis is complete and graph has no actors", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: { analysisComplete: true, actorCount: 0 },
    } as ReturnType<typeof useQuery>);

    render(<GovernanceFindingsQueueQuietEnginesHint scopedRunId="run-1" />);

    expect(screen.getByTestId("run-detail-actor-engines-quiet-hint")).toBeInTheDocument();
  });

  it("hides hint when actor nodes exist", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: { analysisComplete: true, actorCount: 2 },
    } as ReturnType<typeof useQuery>);

    const { container } = render(<GovernanceFindingsQueueQuietEnginesHint scopedRunId="run-1" />);

    expect(container).toBeEmptyDOMElement();
  });
});
