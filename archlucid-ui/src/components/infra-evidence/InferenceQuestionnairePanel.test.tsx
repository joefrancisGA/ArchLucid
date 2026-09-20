import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InferenceQuestionnairePanel } from "@/components/infra-evidence/InferenceQuestionnairePanel";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import * as operatorInferredConnectionApi from "@/lib/infra-evidence/operator-inferred-connection-api";
import type { InferenceQuestionnaireListResponse } from "@/lib/infra-evidence/operator-inferred-connection-types";

vi.mock("@/lib/infra-evidence/operator-inferred-connection-api", () => ({
  listInferenceQuestionnaireItems: vi.fn(),
  confirmOperatorInferredConnection: vi.fn(),
  dismissOperatorInferredConnection: vi.fn(),
}));

const questionnaireResponse: InferenceQuestionnaireListResponse = {
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

describe("InferenceQuestionnairePanel", () => {
  beforeEach(() => {
    vi.mocked(operatorInferredConnectionApi.listInferenceQuestionnaireItems).mockReset();
    vi.mocked(operatorInferredConnectionApi.confirmOperatorInferredConnection).mockReset();
    vi.mocked(operatorInferredConnectionApi.dismissOperatorInferredConnection).mockReset();
    vi.mocked(operatorInferredConnectionApi.listInferenceQuestionnaireItems).mockResolvedValue(
      questionnaireResponse,
    );
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

  it("shows the API message and api-problem recovery when list throws ApiLoadFailureState", async () => {
    vi.mocked(operatorInferredConnectionApi.listInferenceQuestionnaireItems).mockRejectedValue(
      apiLoadFailure("Could not generate questionnaire items."),
    );

    render(<InferenceQuestionnairePanel snapshotId="snapshot-1" />);

    expect(await screen.findByTestId("operator-mutation-inline-error")).toHaveTextContent(
      "Could not generate questionnaire items.",
    );
    expect(screen.getByTestId("operator-error-recovery-what-failed")).toHaveTextContent(
      "ArchLucid could not complete this request.",
    );
    expect(screen.queryByText("The governance change did not save.")).not.toBeInTheDocument();
    expect(screen.queryByText("No proposed questionnaire items remain for this snapshot.")).not.toBeInTheDocument();
    expect(screen.getByTestId("inference-questionnaire-retry")).toBeEnabled();
  });

  it("retries questionnaire list after a load failure", async () => {
    vi.mocked(operatorInferredConnectionApi.listInferenceQuestionnaireItems)
      .mockRejectedValueOnce(apiLoadFailure("Could not generate questionnaire items."))
      .mockResolvedValueOnce(questionnaireResponse);

    render(<InferenceQuestionnairePanel snapshotId="snapshot-1" />);

    fireEvent.click(await screen.findByTestId("inference-questionnaire-retry"));

    expect(await screen.findByTestId("inference-questionnaire-question")).toHaveTextContent(
      "Does archlucid-ui call archlucid-api in the same Container Apps environment?",
    );
    expect(screen.queryByTestId("operator-mutation-inline-error")).not.toBeInTheDocument();
    expect(operatorInferredConnectionApi.listInferenceQuestionnaireItems).toHaveBeenCalledTimes(2);
  });

  it("keeps governance-mutation recovery when yes submit throws ApiLoadFailureState", async () => {
    vi.mocked(operatorInferredConnectionApi.confirmOperatorInferredConnection).mockRejectedValue(
      apiLoadFailure("Could not save your answer: connection missing."),
    );

    render(<InferenceQuestionnairePanel snapshotId="snapshot-1" />);

    fireEvent.click(await screen.findByTestId("inference-questionnaire-yes"));
    fireEvent.click(screen.getByTestId("inference-questionnaire-submit"));

    expect(await screen.findByTestId("operator-mutation-inline-error")).toHaveTextContent(
      "Could not save your answer: connection missing.",
    );
    expect(screen.getByTestId("operator-error-recovery-what-failed")).toHaveTextContent(
      "The governance change did not save.",
    );
    expect(screen.queryByTestId("inference-questionnaire-retry")).not.toBeInTheDocument();
  });
});
