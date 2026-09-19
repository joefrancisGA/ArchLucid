import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorInferredConnectionsPanel } from "@/components/infra-evidence/OperatorInferredConnectionsPanel";
import * as operatorInferredConnectionApi from "@/lib/infra-evidence/operator-inferred-connection-api";

vi.mock("@/lib/infra-evidence/operator-inferred-connection-api", () => ({
  listOperatorInferredConnections: vi.fn(),
  confirmOperatorInferredConnection: vi.fn(),
  dismissOperatorInferredConnection: vi.fn(),
}));

describe("OperatorInferredConnectionsPanel", () => {
  beforeEach(() => {
    vi.mocked(operatorInferredConnectionApi.listOperatorInferredConnections).mockResolvedValue([
      {
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
      },
    ]);
  });

  it("disables confirm until a row is selected", async () => {
    render(<OperatorInferredConnectionsPanel snapshotId="snapshot-1" />);

    expect(await screen.findByTestId("operator-inferred-connections-confirm")).toBeDisabled();

    fireEvent.click(screen.getByLabelText("Select ARCHLUCID_API_BASE_URL"));

    expect(screen.getByTestId("operator-inferred-connections-confirm")).toBeEnabled();
  });
});
