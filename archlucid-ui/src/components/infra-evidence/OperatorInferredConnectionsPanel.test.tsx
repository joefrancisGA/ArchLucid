import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorInferredConnectionsPanel } from "@/components/infra-evidence/OperatorInferredConnectionsPanel";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import * as operatorInferredConnectionApi from "@/lib/infra-evidence/operator-inferred-connection-api";
import type { OperatorInferredConnectionRow } from "@/lib/infra-evidence/operator-inferred-connection-types";

vi.mock("@/lib/infra-evidence/operator-inferred-connection-api", () => ({
  listOperatorInferredConnections: vi.fn(),
  confirmOperatorInferredConnection: vi.fn(),
  dismissOperatorInferredConnection: vi.fn(),
}));

const uploadRow: OperatorInferredConnectionRow = {
  connectionId: "22222222-2222-2222-2222-222222222222",
  snapshotId: "snapshot-1",
  status: "Proposed",
  source: "upload",
  ruleName: null,
  questionText: null,
  fromArmId: null,
  fromLabel: "api",
  fromCloudResourceId: null,
  toHost: "api.example.com",
  toCatalog: null,
  toArmId: null,
  toCloudResourceId: null,
  settingName: "ARCHLUCID_API_BASE_URL",
  sourceFileFormat: "dotenv",
  provenanceKind: "DeterministicInference",
  createdUtc: "2026-01-01T00:00:00Z",
  updatedUtc: "2026-01-01T00:00:00Z",
};

function apiLoadFailure(message: string): ApiLoadFailureState {
  return {
    message,
    problem: { title: "Server error", status: 500 },
    correlationId: "corr-test",
    httpStatus: 500,
    retryAfterSeconds: null,
  };
}

describe("OperatorInferredConnectionsPanel", () => {
  beforeEach(() => {
    vi.mocked(operatorInferredConnectionApi.listOperatorInferredConnections).mockReset();
    vi.mocked(operatorInferredConnectionApi.confirmOperatorInferredConnection).mockReset();
    vi.mocked(operatorInferredConnectionApi.dismissOperatorInferredConnection).mockReset();
    vi.mocked(operatorInferredConnectionApi.listOperatorInferredConnections).mockResolvedValue([uploadRow]);
  });

  it("disables confirm until a row is selected", async () => {
    render(<OperatorInferredConnectionsPanel snapshotId="snapshot-1" />);

    expect(await screen.findByTestId("operator-inferred-connections-confirm")).toBeDisabled();

    fireEvent.click(screen.getByLabelText("Select ARCHLUCID_API_BASE_URL"));

    expect(screen.getByTestId("operator-inferred-connections-confirm")).toBeEnabled();
  });

  it("shows the API message and api-problem recovery when list throws ApiLoadFailureState", async () => {
    vi.mocked(operatorInferredConnectionApi.listOperatorInferredConnections).mockRejectedValue(
      apiLoadFailure("Database Query Failed: table missing."),
    );

    render(<OperatorInferredConnectionsPanel snapshotId="snapshot-1" />);

    expect(await screen.findByTestId("operator-mutation-inline-error")).toHaveTextContent(
      "Database Query Failed: table missing.",
    );
    expect(screen.getByTestId("operator-error-recovery-what-failed")).toHaveTextContent(
      "ArchLucid could not complete this request.",
    );
    expect(screen.queryByText("The governance change did not save.")).not.toBeInTheDocument();
    expect(screen.getByTestId("operator-inferred-connections-retry")).toBeEnabled();
    expect(screen.queryByTestId("operator-inferred-connections-table")).not.toBeInTheDocument();
  });

  it("retries list after a load failure", async () => {
    vi.mocked(operatorInferredConnectionApi.listOperatorInferredConnections)
      .mockRejectedValueOnce(apiLoadFailure("Could not reach the inventory store."))
      .mockResolvedValueOnce([uploadRow]);

    render(<OperatorInferredConnectionsPanel snapshotId="snapshot-1" />);

    fireEvent.click(await screen.findByTestId("operator-inferred-connections-retry"));

    expect(await screen.findByTestId("operator-inferred-connections-table")).toBeInTheDocument();
    expect(screen.queryByTestId("operator-mutation-inline-error")).not.toBeInTheDocument();
    expect(operatorInferredConnectionApi.listOperatorInferredConnections).toHaveBeenCalledTimes(2);
  });

  it("keeps governance-mutation recovery when confirm throws ApiLoadFailureState", async () => {
    vi.mocked(operatorInferredConnectionApi.confirmOperatorInferredConnection).mockRejectedValue(
      apiLoadFailure("Confirm rejected: connection was dismissed."),
    );

    render(<OperatorInferredConnectionsPanel snapshotId="snapshot-1" />);

    fireEvent.click(await screen.findByLabelText("Select ARCHLUCID_API_BASE_URL"));
    fireEvent.click(screen.getByTestId("operator-inferred-connections-confirm"));

    expect(await screen.findByTestId("operator-mutation-inline-error")).toHaveTextContent(
      "Confirm rejected: connection was dismissed.",
    );
    expect(screen.getByTestId("operator-error-recovery-what-failed")).toHaveTextContent(
      "The governance change did not save.",
    );
    expect(screen.queryByTestId("operator-inferred-connections-retry")).not.toBeInTheDocument();
  });
});
