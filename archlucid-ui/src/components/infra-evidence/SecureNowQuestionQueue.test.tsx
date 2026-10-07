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
  resourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf-edw-hi-dev",
  questionKey: "unknown-evidence@v1",
  source: "InventoryEvidence",
  scopeKind: "Resource",
  status: "Open",
  questionText: "Should adf-edw-hi-dev connect to a peer, or stand alone?",
  resourceType: "Microsoft.DataFactory/factories",
  resourceName: "adf-edw-hi-dev",
  reasonText:
    "SecureNow found no connection to or from adf-edw-hi-dev. Data factory is not treated as a shared service that can stand alone.",
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

  it("shows the snapshot promo and opens the question bar", async () => {
    mocks.listQuestions.mockResolvedValue([question]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);

    expect(await screen.findByTestId("infra-diagrams-question-snapshot-promo")).toHaveTextContent("1 open question");
    fireEvent.click(screen.getByRole("button", { name: "Review" }));

    expect(screen.getByTestId("infra-diagrams-question-bar")).toBeInTheDocument();
    expect(screen.getByTestId("infra-diagrams-question-text")).toHaveTextContent(question.questionText);
    expect(screen.getByTestId("infra-diagrams-question-text")).not.toHaveAttribute("title");
    expect(screen.getByTestId("infra-diagrams-question-resource-name")).toHaveTextContent("adf-edw-hi-dev");
    expect(screen.getByText("Data Factory")).toBeInTheDocument();
    expect(screen.getByText("Why SecureNow is asking")).toBeInTheDocument();
    expect(screen.getByTestId("infra-diagrams-question-reason")).toHaveTextContent(question.reasonText);
    expect(screen.getByText("Inventory evidence")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Name the peer" })).toBeInTheDocument();
  });

  it("shows a stored answer for answered questions", async () => {
    mocks.listQuestions.mockResolvedValue([
      question,
      { ...question, status: "Answered", answerCode: "NamePeer", answerText: "Name the peer" },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review" }));
    fireEvent.click(screen.getByRole("button", { name: "Answered", exact: true }));

    expect(screen.getByTestId("infra-diagrams-question-answer")).toHaveTextContent("Answer: Name the peer");
    expect(screen.getByRole("button", { name: "Answered", exact: true })).toBeInTheDocument();
  });

  it("explains when a non-open question has no stored answer", async () => {
    mocks.listQuestions.mockResolvedValue([question, { ...question, status: "Answered" }]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review" }));
    fireEvent.click(screen.getByRole("button", { name: "Answered", exact: true }));

    expect(screen.getByTestId("infra-diagrams-question-answer")).toHaveTextContent(
      "Stored answer was not on this question",
    );
  });

  it("preserves missing and unexpected stored question status", async () => {
    mocks.listQuestions.mockResolvedValue([question, { ...question, status: null, resourceName: "" }]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByTestId("infra-diagrams-question-resource-name")).toHaveTextContent(
      "Resource name was not stored",
    );
    expect(screen.getByText("Question status was not stored")).toBeInTheDocument();
  });

  it("keeps inventory questions visible when inferred connections fail to load", async () => {
    mocks.listQuestions.mockResolvedValue([question]);
    mocks.listConnections.mockRejectedValue(new Error("inferred connections unavailable"));

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);

    expect(await screen.findByTestId("infra-diagrams-question-snapshot-promo")).toHaveTextContent("1 open question");
    expect(screen.getByText("inferred connections unavailable")).toBeInTheDocument();
  });

  it("renders no promo or legacy empty questionnaire copy when there are no open questions", async () => {
    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);

    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalledWith("snapshot-1"));
    expect(screen.queryByTestId("infra-diagrams-question-snapshot-promo")).not.toBeInTheDocument();
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
    fireEvent.click(await screen.findByRole("button", { name: "Review" }));
    fireEvent.click(screen.getByRole("button", { name: "Not sure" }));

    await waitFor(() => expect(screen.getByText("No questions match this filter.")).toBeInTheDocument());
    expect(mocks.answerQuestion).not.toHaveBeenCalled();
    expect(mocks.ignoreQuestion).not.toHaveBeenCalled();
  });

  it("keeps another resource with the same question key after skipping one", async () => {
    mocks.listQuestions.mockResolvedValue([
      question,
      {
        ...question,
        resourceId: "/subscriptions/sub/other-resource",
        questionText: "Should other-resource connect to a peer, or stand alone?",
        resourceName: "other-resource",
        resourceType: "",
        reasonText: "SecureNow found no connection to or from other-resource. This type is not treated as a shared service that can stand alone.",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review" }));
    fireEvent.click(screen.getByRole("button", { name: "Not sure" }));

    expect(
      await screen.findByText("Should other-resource connect to a peer, or stand alone?"),
    ).toBeInTheDocument();
  });

  it("clears skipped question state when the snapshot changes", async () => {
    mocks.listQuestions.mockResolvedValue([question]);

    const view = render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review" }));
    fireEvent.click(screen.getByRole("button", { name: "Not sure" }));

    view.rerender(<SecureNowQuestionQueue snapshotId="snapshot-2" />);

    expect(await screen.findByText(question.questionText)).toBeInTheDocument();
  });

  it("requires a reason before ignoring a question", async () => {
    mocks.listQuestions.mockResolvedValue([question]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review" }));
    fireEvent.click(screen.getByRole("button", { name: "Don't ask again" }));

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox", { name: "Reason for not asking again" }), {
      target: { value: "Reviewed with the subscription owner." },
    });
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });
});
