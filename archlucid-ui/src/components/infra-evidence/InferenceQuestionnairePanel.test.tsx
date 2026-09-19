import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InferenceQuestionnairePanel } from "@/components/infra-evidence/InferenceQuestionnairePanel";
import * as operatorInferredConnectionApi from "@/lib/infra-evidence/operator-inferred-connection-api";

vi.mock("@/lib/infra-evidence/operator-inferred-connection-api", () => ({
  listInferenceQuestionnaireItems: vi.fn(),
  confirmOperatorInferredConnection: vi.fn(),
  dismissOperatorInferredConnection: vi.fn(),
}));

describe("InferenceQuestionnairePanel", () => {
  beforeEach(() => {
    vi.mocked(operatorInferredConnectionApi.listInferenceQuestionnaireItems).mockResolvedValue({
      items: [
        {
          connectionId: "11111111-1111-1111-1111-111111111111",
          snapshotId: "snapshot-1",
          status: "Proposed",
          source: "questionnaire",
          ruleName: "Same Container Apps Environment UI to API",
          questionText: "Does archlucid-ui call archlucid-api in the same Container Apps environment?",
          fromArmId: null,
          fromLabel: "archlucid-ui",
          fromCloudResourceId: null,
          toHost: "archlucid-api",
          toCatalog: null,
          toArmId: null,
          toCloudResourceId: null,
          settingName: null,
          sourceFileFormat: null,
          provenanceKind: "DeterministicInference",
          createdUtc: "2026-01-01T00:00:00Z",
          updatedUtc: "2026-01-01T00:00:00Z",
        },
      ],
      totalCount: 1,
      cap: 50,
      capReached: false,
    });
  });

  it("disables continue until a yes/no/skip choice is selected", async () => {
    render(<InferenceQuestionnairePanel snapshotId="snapshot-1" />);

    expect(await screen.findByTestId("inference-questionnaire-submit")).toBeDisabled();

    fireEvent.click(screen.getByTestId("inference-questionnaire-yes"));

    expect(screen.getByTestId("inference-questionnaire-submit")).toBeEnabled();
  });

  it("calls confirm when yes is submitted", async () => {
    render(<InferenceQuestionnairePanel snapshotId="snapshot-1" />);

    fireEvent.click(await screen.findByTestId("inference-questionnaire-yes"));
    fireEvent.click(screen.getByTestId("inference-questionnaire-submit"));

    expect(operatorInferredConnectionApi.confirmOperatorInferredConnection).toHaveBeenCalledWith(
      "snapshot-1",
      expect.objectContaining({
        connectionId: "11111111-1111-1111-1111-111111111111",
      }),
    );
  });
});
