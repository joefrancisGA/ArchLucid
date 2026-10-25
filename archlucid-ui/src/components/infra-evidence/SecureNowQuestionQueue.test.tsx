import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  SecureNowQuestionQueue,
  SecureNowQuestionQueueProvider,
  SecureNowQuestionQueueSnapshotPromo,
  useSecureNowQuestionQueue,
} from "@/components/infra-evidence/SecureNowQuestionQueue";

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
    const scrollIntoView = vi.fn();
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);

    expect(await screen.findByTestId("infra-diagrams-question-snapshot-promo")).toHaveTextContent("1 open question");
    expect(screen.getByLabelText("Status: Open questions")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Review questions" }));

    expect(screen.getByTestId("infra-diagrams-question-bar")).toBeInTheDocument();
    expect(screen.getByTestId("infra-diagrams-question-text")).toHaveTextContent(question.questionText);
    expect(screen.getByTestId("infra-diagrams-question-text")).not.toHaveAttribute("title");
    expect(screen.getByTestId("infra-diagrams-question-resource-name")).toHaveTextContent("adf-edw-hi-dev");
    expect(screen.getByText("Data Factory")).toBeInTheDocument();
    expect(screen.getByText("Why SecureNow is asking")).toBeInTheDocument();
    expect(screen.getByTestId("infra-diagrams-question-reason")).toHaveTextContent(question.reasonText);
    expect(screen.getByText("Inventory evidence")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Name the peer" })).toBeInTheDocument();
    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    });
  });

  it("shows a stored answer for answered questions", async () => {
    mocks.listQuestions.mockResolvedValue([
      question,
      { ...question, status: "Answered", answerCode: "NamePeer", answerText: "Name the peer", reason: "Operator selected the peer." },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Answered", exact: true }));

    expect(screen.getByTestId("infra-diagrams-question-answer")).toHaveTextContent("Name the peer");
    expect(screen.getByTestId("infra-diagrams-question-answer")).toHaveTextContent("Operator selected the peer.");
    expect(screen.getByRole("button", { name: "Answered", exact: true })).toBeInTheDocument();
  });

  it("preserves an explicitly stored empty answer", async () => {
    mocks.listQuestions.mockResolvedValue([
      question,
      { ...question, status: "Answered", answerCode: null, answerText: "" },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Answered", exact: true }));

    expect(screen.getByTestId("infra-diagrams-question-answer")).toHaveTextContent("Answer code was not stored.");
    expect(screen.getByTestId("infra-diagrams-question-answer")).not.toHaveTextContent("Answer text was not stored.");
    expect(screen.getByTestId("infra-diagrams-question-answer")).toHaveTextContent(
      "Disposition reason was not stored.",
    );
  });

  it("explains when a non-open question has no stored answer (P-20)", async () => {
    mocks.listQuestions.mockResolvedValue([question, { ...question, status: "Answered" }]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Answered", exact: true }));

    const answerPanel = screen.getByTestId("infra-diagrams-question-answer");
    expect(answerPanel).toHaveTextContent("Answer code was not stored.");
    expect(answerPanel).toHaveTextContent("Answer text was not stored.");
    expect(answerPanel).toHaveTextContent("Disposition reason was not stored.");
  });

  it("shows a stored empty or missing disposition reason without changing open questions", async () => {
    mocks.listQuestions.mockResolvedValue([
      question,
      {
        ...question,
        status: "Dismissed",
        reason: "",
        answerCode: "NamePeer",
        answerText: "Name the peer",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismissed", exact: true }));

    const answerPanel = screen.getByTestId("infra-diagrams-question-answer");
    expect(answerPanel).not.toHaveTextContent("Answer code was not stored.");
    expect(answerPanel).not.toHaveTextContent("Answer text was not stored.");
    expect(answerPanel).not.toHaveTextContent("Disposition reason was not stored.");
  });

  it("labels missing subscription id and expiration status in details", async () => {
    mocks.listQuestions.mockResolvedValue([
      { ...question, subscriptionId: null, isExpired: null },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(screen.getByText("Subscription: Subscription id was not stored.")).toBeInTheDocument();
    expect(screen.getByText(/Expiration status was not stored/)).toBeInTheDocument();
  });

  it("maps known question source and scope codes (P-16, P-17)", async () => {
    mocks.listQuestions.mockResolvedValue([
      { ...question, source: "InventoryEvidence", scopeKind: "Resource" },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(screen.getByText("Source: Asked from inventory evidence.")).toBeInTheDocument();
    expect(screen.getByText("Scope: This resource.")).toBeInTheDocument();
  });

  it("labels unknown question source and scope codes (P-16, P-17)", async () => {
    mocks.listQuestions.mockResolvedValue([
      { ...question, source: "CustomSource", scopeKind: "Tenant" },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(screen.getByText("Source: Question source code CustomSource has no reviewer label.")).toBeInTheDocument();
    expect(screen.getByText("Scope: Question scope code Tenant has no reviewer label.")).toBeInTheDocument();
  });

  it("shows omitted question source and scope in details", async () => {
    mocks.listQuestions.mockResolvedValue([
      { ...question, source: null, scopeKind: null },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(screen.getByText("Source: Question source was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Scope: Question scope was not stored.")).toBeInTheDocument();
  });

  it("labels policy pack source and subscription scope in details", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        source: "PolicyPack",
        scopeKind: "Subscription",
        resourceId: "",
        questionKey: "subscription-ownership@v1",
        questionText: "Who owns this subscription workload?",
        sourceLine: "Policy pack",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(screen.getByText("Source: Asked from an assigned policy pack.")).toBeInTheDocument();
    expect(screen.getByText("Scope: This subscription.")).toBeInTheDocument();
  });

  it("preserves missing and unexpected stored question status", async () => {
    mocks.listQuestions.mockResolvedValue([question, { ...question, status: null, resourceName: "" }]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByTestId("infra-diagrams-question-resource-name")).toHaveTextContent(
      "Resource name was stored empty.",
    );
    expect(screen.getByText("Question status was not stored")).toBeInTheDocument();
  });

  it("labels missing question copy, type, reason, and choices", async () => {
    mocks.listQuestions.mockResolvedValue([{
      ...question,
      questionText: "",
      resourceType: "",
      reasonText: "",
      answerCodes: null,
    }]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(screen.getByTestId("infra-diagrams-question-text")).toHaveTextContent("Question text was stored empty.");
    expect(screen.getByText("Resource type was not stored")).toBeInTheDocument();
    expect(screen.getByTestId("infra-diagrams-question-reason")).toHaveTextContent("Reason was not stored");
    expect(screen.getByText("No answer choices were stored on this question.")).toBeInTheDocument();
  });

  it("does not show missing-choice copy for a stored empty choice list", async () => {
    mocks.listQuestions.mockResolvedValue([{ ...question, answerCodes: [] }]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(screen.queryByText("No answer choices were stored on this question.")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Name the peer" })).not.toBeInTheDocument();
  });

  it("keeps inventory questions visible when inferred connections fail to load", async () => {
    mocks.listQuestions.mockResolvedValue([question]);
    mocks.listConnections.mockRejectedValue(new Error("inferred connections unavailable"));

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);

    expect(await screen.findByTestId("infra-diagrams-question-snapshot-promo")).toHaveTextContent("1 open question");
    expect(screen.getByLabelText("Status: Open questions")).toBeInTheDocument();
    expect(screen.getByText("inferred connections unavailable")).toBeInTheDocument();
  });

  it("renders the loaded empty queue without enabling review", async () => {
    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);

    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalledWith("snapshot-1"));
    expect(screen.queryByTestId("infra-diagrams-question-snapshot-promo")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Status: Open questions")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Review questions" })).not.toBeInTheDocument();
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
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Not sure. This does not store an answer." }));

    await waitFor(() => expect(screen.getByText("No questions match this filter.")).toBeInTheDocument());
    expect(mocks.answerQuestion).not.toHaveBeenCalled();
    expect(mocks.ignoreQuestion).not.toHaveBeenCalled();
  });

  it("confirms an inferred connection when its rule name contains spaces", async () => {
    const inferredQuestion = {
      ...question,
      source: "InferredConnection",
      questionKey: "unresolved-host@v1",
      answerCodes: ["Yes", "No", "NotSure"],
    };
    mocks.listQuestions.mockResolvedValue([inferredQuestion]);
    mocks.listConnections.mockResolvedValue([
      {
        connectionId: "connection-1",
        fromArmId: question.resourceId,
        ruleName: "Unresolved host",
      },
    ]);
    mocks.confirmConnection.mockResolvedValue(undefined);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => {
      expect(mocks.confirmConnection).toHaveBeenCalledWith("snapshot-1", {
        connectionId: "connection-1",
      });
    });
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
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Not sure. This does not store an answer." }));

    expect(
      await screen.findByText("Should other-resource connect to a peer, or stand alone?"),
    ).toBeInTheDocument();
  });

  it("clears skipped question state when the snapshot changes", async () => {
    mocks.listQuestions.mockResolvedValue([question]);

    const view = render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Not sure. This does not store an answer." }));

    view.rerender(<SecureNowQuestionQueue snapshotId="snapshot-2" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(await screen.findByText(question.questionText)).toBeInTheDocument();
  });

  it("does not persist a question from the previous snapshot while the next snapshot is loading", async () => {
    const snapshotOneQuestion = {
      ...question,
      snapshotId: "snapshot-1",
    };
    let resolveSnapshotTwoLoad: ((value: typeof question[]) => void) | undefined;
    const snapshotTwoLoad = new Promise<typeof question[]>((resolve) => {
      resolveSnapshotTwoLoad = resolve;
    });
    mocks.listQuestions
      .mockResolvedValueOnce([snapshotOneQuestion])
      .mockImplementationOnce(() => snapshotTwoLoad);

    const view = render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Don't ask again" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Reason for not asking again" }), {
      target: { value: "Reviewed with the subscription owner." },
    });

    view.rerender(<SecureNowQuestionQueue snapshotId="snapshot-2" />);
    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalledTimes(2));

    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
    expect(mocks.ignoreQuestion).not.toHaveBeenCalled();

    resolveSnapshotTwoLoad?.([]);
  });

  it("keeps the newest snapshot question when an older load finishes later", async () => {
    let resolveFirstLoad: ((value: typeof question[]) => void) | undefined;
    let resolveSecondLoad: ((value: typeof question[]) => void) | undefined;
    const firstLoad = new Promise<typeof question[]>((resolve) => {
      resolveFirstLoad = resolve;
    });
    const secondLoad = new Promise<typeof question[]>((resolve) => {
      resolveSecondLoad = resolve;
    });
    mocks.listQuestions
      .mockImplementationOnce(() => firstLoad)
      .mockImplementationOnce(() => secondLoad);

    const view = render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalledTimes(1));

    view.rerender(<SecureNowQuestionQueue snapshotId="snapshot-2" />);
    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalledTimes(2));

    const newestQuestion = {
      ...question,
      snapshotId: "snapshot-2",
      questionText: "Newest snapshot question",
    };
    resolveSecondLoad?.([newestQuestion]);

    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    expect(await screen.findByText("Newest snapshot question")).toBeInTheDocument();

    resolveFirstLoad?.([question]);
    await waitFor(() => expect(screen.getByTestId("infra-diagrams-question-snapshot-promo")).toHaveTextContent("1 open question"));
    expect(screen.queryByText("Newest snapshot question")).toBeInTheDocument();
  });

  it("keeps question-queue hooks mounted when snapshotId is empty", () => {
    function EmptySnapshotQueueProbe() {
      const { drawerOpen } = useSecureNowQuestionQueue();

      return <div data-testid="empty-snapshot-queue-probe">{drawerOpen ? "open" : "closed"}</div>;
    }

    render(
      <SecureNowQuestionQueueProvider snapshotId="">
        <EmptySnapshotQueueProbe />
      </SecureNowQuestionQueueProvider>,
    );

    expect(screen.getByTestId("empty-snapshot-queue-probe")).toHaveTextContent("closed");
    expect(screen.queryByTestId("securenow-question-queue")).not.toBeInTheDocument();
    expect(mocks.listQuestions).not.toHaveBeenCalled();
  });

  it("keeps queue context when snapshotId is empty so nested consumers do not crash", () => {
    expect(() => {
      render(
        <SecureNowQuestionQueueProvider snapshotId="">
          <SecureNowQuestionQueueSnapshotPromo compact />
        </SecureNowQuestionQueueProvider>,
      );
    }).not.toThrow();

    expect(screen.queryByTestId("infra-diagrams-question-snapshot-promo")).not.toBeInTheDocument();
    expect(screen.queryByTestId("securenow-question-queue")).not.toBeInTheDocument();
  });

  it("answers a subscription-scope pack question when resource id is null", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        resourceId: null,
        scopeKind: "Subscription",
        source: "PolicyPack",
        questionKey: "subscription-ownership@v1",
        questionText: "Who owns this subscription workload?",
        answerCodes: ["Register", "Keep"],
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Register" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => {
      expect(mocks.answerQuestion).toHaveBeenCalledWith("snapshot-1", {
        subscriptionId: "subscription-1",
        resourceId: "",
        questionKey: "subscription-ownership@v1",
        source: "PolicyPack",
        scopeKind: "Subscription",
        answerCode: "Register",
        answerText: "Register",
        reason: "Answered in the SecureNow subscription question queue.",
        evidenceFingerprint: "fingerprint",
      });
    });
  });

  it("requires a reason before ignoring a question", async () => {
    mocks.listQuestions.mockResolvedValue([question]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Don't ask again" }));

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox", { name: "Reason for not asking again" }), {
      target: { value: "Reviewed with the subscription owner." },
    });
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });
});
