import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SecureNowQuestionQueue } from "@/components/infra-evidence/SecureNowQuestionQueue";

const mocks = vi.hoisted(() => ({
  listQuestions: vi.fn(),
  listConnections: vi.fn(),
  answerQuestion: vi.fn(),
  ignoreQuestion: vi.fn(),
  reopenQuestion: vi.fn(),
  confirmConnection: vi.fn(),
  dismissConnection: vi.fn(),
}));

vi.mock("@/lib/infra-evidence/securenow-question-queue-api", () => ({
  listSecureNowQuestions: mocks.listQuestions,
  answerSecureNowQuestion: mocks.answerQuestion,
  ignoreSecureNowQuestion: mocks.ignoreQuestion,
  reopenSecureNowQuestion: mocks.reopenQuestion,
}));

vi.mock("@/lib/infra-evidence/operator-inferred-connection-api", () => ({
  listOperatorInferredConnections: mocks.listConnections,
  confirmOperatorInferredConnection: mocks.confirmConnection,
  dismissOperatorInferredConnection: mocks.dismissConnection,
}));

const question = {
  dispositionId: null,
  snapshotId: "snapshot-1",
  subscriptionId: "subscription-1",
  resourceId: "/subscriptions/sub/resource",
  questionKey: "unknown-evidence@v1",
  source: "InventoryEvidence",
  scopeKind: "Resource",
  status: "Open",
  questionText: "Should this resource connect to a peer, or stand alone?",
  sourceLine: "Inventory evidence",
  answerCodes: ["NamePeer", "StandsAlone", "NotSure"],
  evidenceFingerprint: "fingerprint",
  expirationUtc: null,
  isExpired: false,
  answerCode: null,
  answerText: null,
  reason: null,
};

describe("SecureNowQuestionQueue", () => {
  beforeEach(() => {
    mocks.listQuestions.mockReset();
    mocks.listConnections.mockReset();
    mocks.answerQuestion.mockReset();
    mocks.ignoreQuestion.mockReset();
    mocks.reopenQuestion.mockReset();
    mocks.confirmConnection.mockReset();
    mocks.dismissConnection.mockReset();
    mocks.listQuestions.mockResolvedValue([]);
    mocks.listConnections.mockResolvedValue([]);
    mocks.answerQuestion.mockResolvedValue(undefined);
    mocks.ignoreQuestion.mockResolvedValue(undefined);
    mocks.reopenQuestion.mockResolvedValue(undefined);
  });

  it("shows the singular hero and opens the side drawer", async () => {
    mocks.listQuestions.mockResolvedValue([question]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);

    expect(await screen.findByTestId("infra-diagrams-question-hero")).toHaveTextContent(
      "SecureNow has 1 question about this subscription.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Start answering" }));

    expect(screen.getByTestId("infra-diagrams-question-drawer")).toBeInTheDocument();
    expect(screen.getByTestId("infra-diagrams-question-text")).toHaveTextContent(question.questionText);
    expect(screen.getByText("Inventory evidence")).toBeInTheDocument();
  });

  it("keeps inventory questions visible when inferred connections fail to load", async () => {
    mocks.listQuestions.mockResolvedValue([question]);
    mocks.listConnections.mockRejectedValue(new Error("inferred connections unavailable"));

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);

    expect(await screen.findByTestId("infra-diagrams-question-hero")).toHaveTextContent(
      "SecureNow has 1 question about this subscription.",
    );
    expect(screen.getByText("inferred connections unavailable")).toBeInTheDocument();
  });

  it("renders no hero or legacy empty questionnaire copy when there are no open questions", async () => {
    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);

    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalledWith("snapshot-1"));
    expect(screen.queryByTestId("infra-diagrams-question-hero")).not.toBeInTheDocument();
    expect(screen.queryByText("No proposed questionnaire items remain for this snapshot.")).not.toBeInTheDocument();
  });

  it("shows the API load failure and API recovery copy when questions cannot be loaded", async () => {
    mocks.listQuestions.mockRejectedValue({
      message: "Invalid object name 'dbo.SecureNowQuestionDispositions'.",
      problem: null,
      correlationId: "corr-123",
      httpStatus: 500,
      retryAfterSeconds: null,
    });

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);

    expect(
      await screen.findByText("Invalid object name 'dbo.SecureNowQuestionDispositions'."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Could not load SecureNow questions.")).not.toBeInTheDocument();
    expect(screen.queryByText("The governance change did not save.")).not.toBeInTheDocument();
    expect(
      screen.getByText("Retry the action, then open troubleshooting if the error repeats."),
    ).toBeInTheDocument();
  });

  it("advances NotSure without persisting an answer", async () => {
    mocks.listQuestions.mockResolvedValue([question]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Start answering" }));
    fireEvent.click(screen.getByRole("button", { name: "NotSure" }));

    await waitFor(() => expect(screen.getByText("No questions match this filter.")).toBeInTheDocument());
    expect(mocks.answerQuestion).not.toHaveBeenCalled();
    expect(mocks.ignoreQuestion).not.toHaveBeenCalled();
  });

  it("requires a reason before ignoring a question", async () => {
    mocks.listQuestions.mockResolvedValue([question]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Start answering" }));
    fireEvent.click(screen.getByRole("button", { name: "Don't ask again" }));

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox", { name: "Reason for not asking again" }), {
      target: { value: "Reviewed with the subscription owner." },
    });
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });
});
