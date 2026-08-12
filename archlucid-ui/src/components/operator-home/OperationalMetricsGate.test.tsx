import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.unmock("@/hooks/use-core-pilot-commit-context-query");

vi.mock("@/lib/query/operator-query-persist-client", () => ({
  setupOperatorQueryClientPersistence: () => {},
}));

vi.mock("@/lib/core-pilot-commit-context", async (importOriginal) => {
  const { createCorePilotCommitContextModuleMock } = await import("@/testing/core-pilot-commit-context.mock");

  return createCorePilotCommitContextModuleMock(importOriginal);
});

import { fetchCorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

import { OperationalMetricsGate } from "./OperationalMetricsGate";

const fetchCtx = vi.mocked(fetchCorePilotCommitContext);

describe("OperationalMetricsGate", () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetOperatorQueryClientForTests();
  });

  it("renders nothing while loading", () => {
    fetchCtx.mockImplementation(() => new Promise(() => {}));

    renderWithOperatorQuery(
      <OperationalMetricsGate>
        <div data-testid="gated-child">Child</div>
      </OperationalMetricsGate>,
    );

    expect(screen.queryByTestId("gated-child")).not.toBeInTheDocument();
  });

  it("hides children when no committed manifest is detected", async () => {
    fetchCtx.mockResolvedValue({
      hasCommittedManifest: false,
      committedReviewCount: 0,
      latestRunId: "00000000-0000-0000-0000-000000000099",
      firstCommittedRunId: null,
      secondCommittedRunId: null,
      latestRunReadyToFinalize: false,
    });

    renderWithOperatorQuery(
      <OperationalMetricsGate>
        <div data-testid="gated-child">Child</div>
      </OperationalMetricsGate>,
    );

    await waitFor(() => {
      expect(fetchCtx).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("gated-child")).not.toBeInTheDocument();
  });

  it("shows children when a committed manifest exists", async () => {
    fetchCtx.mockResolvedValue({
      hasCommittedManifest: true,
      committedReviewCount: 1,
      latestRunId: "00000000-0000-0000-0000-000000000001",
      firstCommittedRunId: "00000000-0000-0000-0000-000000000001",
      secondCommittedRunId: null,
      latestRunReadyToFinalize: false,
    });

    renderWithOperatorQuery(
      <OperationalMetricsGate>
        <div data-testid="gated-child">Child</div>
      </OperationalMetricsGate>,
    );

    expect(await screen.findByTestId("gated-child")).toBeInTheDocument();
  });

  it("fails open when commit context resolution throws", async () => {
    fetchCtx.mockRejectedValue(new Error("network"));

    renderWithOperatorQuery(
      <OperationalMetricsGate>
        <div data-testid="gated-child">Child</div>
      </OperationalMetricsGate>,
    );

    expect(await screen.findByTestId("gated-child")).toBeInTheDocument();
  });
});
