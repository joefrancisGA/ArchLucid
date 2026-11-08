import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const scopeState = vi.hoisted(() => ({
  projectId: "project-a",
}));
const listRunsByProjectPagedMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  listRunsByProjectPaged: listRunsByProjectPagedMock,
}));

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  getEffectiveBrowserProxyScopeHeaders: () => ({
    "X-ArchLucid-Project-Id": scopeState.projectId,
  }),
}));

vi.mock("@/hooks/use-operator-scope-record", () => ({
  useOperatorScopeRecord: () => ({
    tenantId: scopeState.projectId,
    workspaceId: scopeState.projectId,
    projectId: scopeState.projectId,
    workspaceLabel: scopeState.projectId,
    projectLabel: scopeState.projectId,
  }),
}));

vi.mock("@/lib/operator/operator-response-guards", () => ({
  coerceRunSummaryPaged: (raw: unknown) => ({
    ok: true,
    value: { items: raw },
  }),
}));

vi.mock("@/lib/operator/operator-runs-list-with-demo-fallback", () => ({
  enrichRunsListWithStaticDemoFallback: (runs: unknown) => runs,
}));

vi.mock("./ArchitectureIntelligenceNextReviewFooter", () => ({
  ArchitectureIntelligenceNextReviewFooter: ({
    target,
  }: {
    target: { readonly runId: string };
  }) => <div data-testid="next-review-target">{target.runId}</div>,
  architectureIntelligenceNextReviewHref: (runId: string) => `/architecture/intelligence?runId=${runId}`,
}));

import { ArchitectureIntelligenceNextReviewFooterClient } from "./ArchitectureIntelligenceNextReviewFooterClient";

function run(runId: string, createdUtc: string) {
  return {
    runId,
    createdUtc,
    description: runId,
    displayName: runId,
  };
}

describe("ArchitectureIntelligenceNextReviewFooterClient", () => {
  beforeEach(() => {
    scopeState.projectId = "project-a";
    listRunsByProjectPagedMock.mockReset();
  });

  it("does not commit the prior scope's next-review footer after an operator scope switch", async () => {
    const resolvers: Array<(value: unknown) => void> = [];
    listRunsByProjectPagedMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvers.push(resolve);
        }),
    );

    const view = render(
      <ArchitectureIntelligenceNextReviewFooterClient runId="current-review" />,
    );
    await waitFor(() => {
      expect(listRunsByProjectPagedMock).toHaveBeenCalledTimes(1);
    });

    scopeState.projectId = "project-b";
    view.rerender(<ArchitectureIntelligenceNextReviewFooterClient runId="current-review" />);

    await act(async () => {
      resolvers[0]?.([
        run("current-review", "2026-01-02T00:00:00Z"),
        run("prior-scope-next-review", "2026-01-01T00:00:00Z"),
      ]);
    });

    expect(screen.queryByTestId("next-review-target")).toBeNull();
  });
});
