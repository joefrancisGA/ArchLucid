import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorOutboxDiagnosticsCard } from "@/components/operator/OperatorOutboxDiagnosticsCard";
import { fetchAdminOutboxDiagnostics } from "@/lib/fetch-admin-outbox-diagnostics";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

vi.mock("@/lib/fetch-admin-outbox-diagnostics", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/fetch-admin-outbox-diagnostics")>();

  return {
    ...actual,
    fetchAdminOutboxDiagnostics: vi.fn(),
  };
});

vi.mock("@/lib/query/operator-query-persist-client", () => ({
  setupOperatorQueryClientPersistence: () => {},
}));

const fetchOutboxMock = vi.mocked(fetchAdminOutboxDiagnostics);

describe("OperatorOutboxDiagnosticsCard", () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetOperatorQueryClientForTests();
    fetchOutboxMock.mockReset();
  });

  it("renders queue depth metrics when diagnostics load", async () => {
    fetchOutboxMock.mockResolvedValue({
      authorityPipelineWorkPending: 3,
      authorityPipelineWorkDeadLetter: 0,
      retrievalIndexingPending: 1,
      integrationEventOutboxPublishPending: 2,
      integrationEventOutboxDeadLetter: 0,
    });

    renderWithOperatorQuery(<OperatorOutboxDiagnosticsCard />);

    await waitFor(() => {
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    expect(screen.getByTestId("operator-outbox-diagnostics-card")).toBeInTheDocument();
    expect(screen.getByText("Authority pipeline pending")).toBeInTheDocument();
  });

  it("renders unavailable copy when diagnostics cannot be loaded", async () => {
    fetchOutboxMock.mockResolvedValue(null);

    renderWithOperatorQuery(<OperatorOutboxDiagnosticsCard />);

    expect(
      await screen.findByText("Admin diagnostics unavailable for this account."),
    ).toBeInTheDocument();
  });
});
