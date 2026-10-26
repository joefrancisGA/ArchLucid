import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  SecureNowQuestionQueue,
  SecureNowQuestionQueueBar,
  SecureNowQuestionQueueProvider,
  SecureNowQuestionQueueSnapshotPromo,
  useSecureNowQuestionQueue,
} from "@/components/infra-evidence/SecureNowQuestionQueue";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";

const mocks = vi.hoisted(() => ({
  listQuestions: vi.fn(),
  listConnections: vi.fn(),
  answerQuestion: vi.fn(),
  ignoreQuestion: vi.fn(),
  reopenQuestion: vi.fn(),
  confirmConnection: vi.fn(),
  dismissConnection: vi.fn(),
}));

vi.mock("@/lib/infra-evidence/securenow-question-queue-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/infra-evidence/securenow-question-queue-api")>();
  return {
    ...actual,
    listSecureNowQuestions: mocks.listQuestions,
    answerSecureNowQuestion: mocks.answerQuestion,
    ignoreSecureNowQuestion: mocks.ignoreQuestion,
    reopenSecureNowQuestion: mocks.reopenQuestion,
  };
});

vi.mock("@/lib/infra-evidence/operator-inferred-connection-api", () => ({
  listOperatorInferredConnections: mocks.listConnections,
  confirmOperatorInferredConnection: mocks.confirmConnection,
  dismissOperatorInferredConnection: mocks.dismissConnection,
}));

function apiLoadFailure(message: string): ApiLoadFailureState {
  return {
    message,
    problem: { title: "Bad Request", status: 400 },
    correlationId: "corr-test",
    httpStatus: 400,
    retryAfterSeconds: null,
  };
}

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

  it("routes padded answered status into the answered filter", async () => {
    mocks.listQuestions.mockResolvedValue([
      question,
      {
        ...question,
        status: "  Answered  ",
        answerCode: "NamePeer",
        answerText: "Name the peer",
        reason: "Operator selected the peer.",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Answered", exact: true }));

    expect(screen.getByTestId("infra-diagrams-question-answer")).toHaveTextContent("Name the peer");
    expect(screen.queryByText("Which peer should this connection use?")).not.toBeInTheDocument();
  });

  it("shows trimmed closed-question answer metadata in the answered filter", async () => {
    mocks.listQuestions.mockResolvedValue([
      question,
      {
        ...question,
        status: "  Answered  ",
        answerCode: "  NamePeer  ",
        answerText: "  Name the peer  ",
        reason: "  Operator selected the peer.  ",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Answered", exact: true }));

    const answerPanel = screen.getByTestId("infra-diagrams-question-answer");
    expect(answerPanel).toHaveTextContent("Name the peer");
    expect(answerPanel).toHaveTextContent("Operator selected the peer.");
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

  it("shows trimmed subscription and fingerprint values in details", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        subscriptionId: "  subscription-1  ",
        evidenceFingerprint: "  fingerprint  ",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(screen.getByText("Subscription: subscription-1")).toBeInTheDocument();
    expect(screen.getByText("Evidence fingerprint: fingerprint")).toBeInTheDocument();
  });

  it("shows trimmed reason and source lines in details", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        reasonText: `  ${question.reasonText}  `,
        sourceLine: "  Inventory evidence  ",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(screen.getByTestId("infra-diagrams-question-reason")).toHaveTextContent(question.reasonText);
    expect(screen.getByText("Inventory evidence")).toBeInTheDocument();
  });

  it("does not change question filter while a save answer mutation is in flight", async () => {
    let resolveAnswer!: () => void;
    mocks.listQuestions.mockResolvedValue([question]);
    mocks.answerQuestion.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveAnswer = () => resolve();
        }),
    );

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    expect(screen.getByRole("button", { name: "Answered" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Open" })).toBeDisabled();

    resolveAnswer();
    await waitFor(() => expect(mocks.answerQuestion).toHaveBeenCalledTimes(1));
  });

  it("does not skip via Not sure while a save answer mutation is in flight", async () => {
    const secondQuestion = {
      ...question,
      questionKey: "other-evidence@v1",
      questionText: "Second question in the queue?",
    };
    let resolveAnswer!: () => void;
    mocks.listQuestions.mockResolvedValue([question, secondQuestion]);
    mocks.answerQuestion.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveAnswer = () => resolve();
        }),
    );

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    const notSureButton = screen.getByRole("button", { name: "Not sure. This does not store an answer." });
    expect(notSureButton).toBeDisabled();
    fireEvent.click(notSureButton);

    expect(screen.getByTestId("infra-diagrams-question-text")).toHaveTextContent(question.questionText);

    resolveAnswer();
    await waitFor(() => expect(mocks.answerQuestion).toHaveBeenCalledTimes(1));
  });

  it("skips only one row when omitted keys share text but fingerprints differ", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        questionKey: null,
        dispositionId: null,
        questionText: "Shared prompt without a stored key?",
        evidenceFingerprint: "fingerprint-a",
      },
      {
        ...question,
        questionKey: null,
        dispositionId: null,
        questionText: "Shared prompt without a stored key?",
        evidenceFingerprint: "fingerprint-b",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(screen.getAllByText("Shared prompt without a stored key?")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Not sure. This does not store an answer." }));

    expect(await screen.findByText("Shared prompt without a stored key?")).toBeInTheDocument();
    expect(screen.queryByText("No questions match this filter.")).not.toBeInTheDocument();
  });

  it("shows trimmed expiration timestamps in details", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        expirationUtc: "  2099-01-01T00:00:00.000Z  ",
        isExpired: false,
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(screen.getByText(/2099-01-01T00:00:00.000Z · Not expired/)).toBeInTheDocument();
  });

  it("renders inventory source and scope details when question key is omitted", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        questionKey: null,
        source: "InventoryEvidence",
        scopeKind: "Resource",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(screen.getByText("Source: Asked from inventory evidence.")).toBeInTheDocument();
    expect(screen.getByText("Scope: This resource.")).toBeInTheDocument();
  });

  it("does not post a mutation when question key was stored as whitespace", async () => {
    mocks.listQuestions.mockResolvedValue([{ ...question, questionKey: "   " }]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => {
      expect(screen.getByTestId("operator-mutation-inline-error")).toHaveTextContent(
        "Question key was not stored.",
      );
    });
    expect(mocks.answerQuestion).not.toHaveBeenCalled();
  });

  it("does not post a mutation when question key was not stored", async () => {
    mocks.listQuestions.mockResolvedValue([{ ...question, questionKey: null }]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => {
      expect(screen.getByTestId("operator-mutation-inline-error")).toHaveTextContent(
        "Question key was not stored.",
      );
    });
    expect(mocks.answerQuestion).not.toHaveBeenCalled();
  });

  it("does not post a mutation when resource id was stored as whitespace on inventory rows", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        resourceId: "   ",
        source: "InventoryEvidence",
        scopeKind: "Resource",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => {
      expect(screen.getByTestId("operator-mutation-inline-error")).toHaveTextContent(
        "Resource id was not stored.",
      );
    });
    expect(mocks.answerQuestion).not.toHaveBeenCalled();
  });

  it("does not post a mutation when resource id was not stored on inventory rows", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        resourceId: null,
        source: "InventoryEvidence",
        scopeKind: "Resource",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => {
      expect(screen.getByTestId("operator-mutation-inline-error")).toHaveTextContent(
        "Resource id was not stored.",
      );
    });
    expect(mocks.answerQuestion).not.toHaveBeenCalled();
  });

  it("does not post a mutation when evidence fingerprint was not stored", async () => {
    mocks.listQuestions.mockResolvedValue([{ ...question, evidenceFingerprint: null }]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => {
      expect(screen.getByTestId("operator-mutation-inline-error")).toHaveTextContent(
        "Evidence fingerprint was not stored.",
      );
    });
    expect(mocks.answerQuestion).not.toHaveBeenCalled();
  });

  it("does not post a mutation when subscription id was not stored", async () => {
    mocks.listQuestions.mockResolvedValue([{ ...question, subscriptionId: null }]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => {
      expect(screen.getByText("Subscription id was not stored.")).toBeInTheDocument();
    });
    expect(mocks.answerQuestion).not.toHaveBeenCalled();
  });

  it("marks expiration as expired in details when expirationUtc is past but isExpired is false", async () => {
    vi.setSystemTime(new Date("2026-10-25T12:00:00.000Z"));
    mocks.listQuestions.mockResolvedValue([
      question,
      {
        ...question,
        status: "Answered",
        expirationUtc: "2026-10-25T11:00:00.000Z",
        isExpired: false,
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Answered", exact: true }));

    expect(screen.getByText(/· Expired/)).toBeInTheDocument();
    expect(screen.queryByText(/· Not expired/)).not.toBeInTheDocument();
    vi.useRealTimers();
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

  it("labels resource scope in details when scopeKind is omitted on inventory evidence rows", async () => {
    mocks.listQuestions.mockResolvedValue([
      { ...question, source: "InventoryEvidence", scopeKind: null },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(screen.getByText("Scope: Question scope was not stored.")).toBeInTheDocument();
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

  it("shows pack-friendly identity when policy pack source omits scopeKind", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        source: "PolicyPack",
        scopeKind: null,
        resourceId: "",
        resourceType: "",
        resourceName: "",
        questionKey: "rg-scope@v1",
        questionText: "Which resource group owns this workload?",
        answerCodes: ["Register", "Keep"],
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(screen.getByTestId("infra-diagrams-question-resource-name")).toHaveTextContent(
      "Resource group question",
    );
    expect(screen.queryByText("Resource type was not stored")).not.toBeInTheDocument();
  });

  it("shows pack-friendly resource identity instead of empty-resource warnings", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        source: "PolicyPack",
        scopeKind: "Subscription",
        resourceId: "",
        resourceType: "",
        resourceName: "",
        questionKey: "subscription-ownership@v1",
        questionText: "Who owns this subscription workload?",
        answerCodes: ["Register", "Keep"],
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(screen.queryByText("Resource type was not stored")).not.toBeInTheDocument();
    expect(screen.queryByText("Resource name was stored empty.")).not.toBeInTheDocument();
    expect(screen.getByTestId("infra-diagrams-question-resource-name")).toHaveTextContent("Subscription question");
  });

  it("does not warn about resource id when scopeKind is omitted on policy pack rows with empty listed resource id", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        resourceId: "",
        scopeKind: null,
        source: "PolicyPack",
        questionKey: "rg-scope@v1",
        questionText: "Which resource group owns this workload?",
        answerCodes: ["Register", "Keep"],
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(screen.queryByText("Resource id was stored empty.")).not.toBeInTheDocument();
    expect(screen.queryByText("Resource id was not stored.")).not.toBeInTheDocument();
  });

  it("labels resource group scope in details when scopeKind is omitted on policy pack rows", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        source: "PolicyPack",
        scopeKind: null,
        resourceId: "",
        questionKey: "rg-scope@v1",
        questionText: "Which resource group owns this workload?",
        sourceLine: "Policy pack",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

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
    mocks.listQuestions.mockResolvedValue([{ ...question, status: null, resourceName: "" }]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Status not stored" }));

    expect(screen.getByTestId("infra-diagrams-question-resource-name")).toHaveTextContent(
      "Resource name was stored empty.",
    );
    expect(screen.getByText("Question status was not stored")).toBeInTheDocument();
  });

  it("does not show open answer actions when list JSON omits question status", async () => {
    mocks.listQuestions.mockResolvedValue([{ ...question, status: null }]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Status not stored" }));

    expect(screen.queryByRole("button", { name: "Name the peer" })).not.toBeInTheDocument();
  });

  it("shows answer actions when list JSON stores lowercase open status", async () => {
    mocks.listQuestions.mockResolvedValue([{ ...question, status: "open" }]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(screen.getByRole("button", { name: "Name the peer" })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Reason required to reopen")).not.toBeInTheDocument();
  });

  it("shows stored answer metadata instead of answer actions when status is omitted but answer fields are stored", async () => {
    mocks.listQuestions.mockResolvedValue([
      { ...question, status: null },
      {
        ...question,
        status: null,
        answerCode: "NamePeer",
        answerText: "Name the peer",
        reason: "Operator selected the peer.",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Answered" }));

    expect(screen.getByTestId("infra-diagrams-question-answer")).toHaveTextContent("Name the peer");
    expect(screen.queryByRole("button", { name: "Name the peer" })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Reason required to reopen")).toBeInTheDocument();
    expect(screen.getByTestId("infra-diagrams-question-disposition-status")).toHaveTextContent("Answered");
  });

  it("hides open answer chrome when list JSON omits status even with whitespace-only disposition fields", async () => {
    mocks.listQuestions.mockResolvedValue([{
      ...question,
      status: null,
      answerCode: "   ",
      answerText: "",
      reason: "   ",
    }]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Status not stored" }));

    expect(screen.queryByRole("button", { name: "Name the peer" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("infra-diagrams-question-answer")).not.toBeInTheDocument();
  });

  it("routes Open status with stored answer metadata into the answered filter", async () => {
    mocks.listQuestions.mockResolvedValue([
      { ...question, status: "Open" },
      {
        ...question,
        status: "Open",
        answerCode: "NamePeer",
        answerText: "Name the peer",
        reason: "Operator selected the peer.",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Answered" }));

    expect(screen.getByTestId("infra-diagrams-question-disposition-status")).toHaveTextContent("Answered");
    expect(screen.getByTestId("infra-diagrams-question-answer")).toHaveTextContent("Name the peer");
    expect(screen.queryByRole("button", { name: "Name the peer" })).not.toBeInTheDocument();
  });

  it("shows dismissed status label when list JSON omits status but stores a dismiss reason", async () => {
    mocks.listQuestions.mockResolvedValue([
      { ...question, status: null },
      {
        ...question,
        status: null,
        answerCode: null,
        answerText: null,
        reason: "Operator chose not to answer.",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismissed" }));

    expect(screen.getByTestId("infra-diagrams-question-disposition-status")).toHaveTextContent("Dismissed");
    expect(screen.getByText("Operator chose not to answer.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Name the peer" })).not.toBeInTheDocument();
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

  it("shows a stored empty answer choice line", async () => {
    mocks.listQuestions.mockResolvedValue([{ ...question, answerCodes: ["Yes", ""] }]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(screen.getByRole("button", { name: "Answer choice was stored empty." })).toBeInTheDocument();
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

  it("skips only the active question when multiple open rows omit question keys", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        questionKey: null,
        questionText: "First question without a stored key?",
        evidenceFingerprint: null,
      },
      {
        ...question,
        questionKey: null,
        questionText: "Second question without a stored key?",
        evidenceFingerprint: null,
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(screen.getByText("First question without a stored key?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Not sure. This does not store an answer." }));

    expect(await screen.findByText("Second question without a stored key?")).toBeInTheDocument();
    expect(screen.queryByText("No questions match this filter.")).not.toBeInTheDocument();
  });

  it("skips only the active row when omitted keys share question text but disposition ids differ", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        questionKey: null,
        questionText: "Shared prompt without a stored key?",
        dispositionId: "disposition-1",
      },
      {
        ...question,
        questionKey: null,
        questionText: "Shared prompt without a stored key?",
        dispositionId: "disposition-2",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(screen.getAllByText("Shared prompt without a stored key?")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Not sure. This does not store an answer." }));

    expect(await screen.findByText("Shared prompt without a stored key?")).toBeInTheDocument();
    expect(screen.queryByText("No questions match this filter.")).not.toBeInTheDocument();
  });

  it("ignores an inferred connection when list JSON omits source on a legacy question key", async () => {
    const inferredQuestion = {
      ...question,
      source: null,
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
    mocks.ignoreQuestion.mockResolvedValue(undefined);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Don't ask again" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Reason for not asking again" }), {
      target: { value: "Connection already reviewed with the network team." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mocks.ignoreQuestion).toHaveBeenCalledWith("snapshot-1", {
        subscriptionId: "subscription-1",
        resourceId: question.resourceId,
        questionKey: "unresolved-host@v1",
        source: "InferredConnection",
        scopeKind: "Resource",
        reason: "Connection already reviewed with the network team.",
        evidenceFingerprint: "fingerprint",
      });
    });
  });

  it("confirms an inferred connection when list JSON omits source on a legacy question key", async () => {
    const inferredQuestion = {
      ...question,
      source: null,
      scopeKind: null,
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

    expect(screen.getByText("Scope: Question scope was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Source: Question source was not stored.")).toBeInTheDocument();
    expect(screen.queryByText("Source: Asked because a connection was inferred. Answering does not store a link.")).not.toBeInTheDocument();
    expect(screen.queryByText("Source: Asked from inventory evidence.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => {
      expect(mocks.confirmConnection).toHaveBeenCalledWith("snapshot-1", {
        connectionId: "connection-1",
      });
    });
    expect(mocks.answerQuestion).not.toHaveBeenCalled();
  });

  it("focuses the inferred question after confirm when another open inferred row exists", async () => {
    const otherInferred = {
      ...question,
      resourceId:
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/other-resource",
      resourceName: "other-resource",
      questionText: "Should other-resource connect to a peer, or stand alone?",
      source: null,
      questionKey: "unresolved-host@v1",
      answerCodes: ["Yes", "No", "NotSure"],
    };
    const inferredQuestion = {
      ...question,
      source: null,
      questionKey: "unresolved-host@v1",
      answerCodes: ["Yes", "No", "NotSure"],
    };

    mocks.listQuestions
      .mockResolvedValueOnce([inferredQuestion, otherInferred])
      .mockResolvedValueOnce([inferredQuestion, otherInferred]);
    mocks.listConnections.mockResolvedValue([
      {
        connectionId: "connection-1",
        fromArmId: question.resourceId,
        ruleName: "Unresolved host",
      },
      {
        connectionId: "connection-2",
        fromArmId: otherInferred.resourceId,
        ruleName: "Unresolved host",
      },
    ]);
    mocks.confirmConnection.mockResolvedValue(undefined);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalledTimes(2));
    await waitFor(() => {
      expect(mocks.confirmConnection).toHaveBeenCalledWith("snapshot-1", {
        connectionId: "connection-1",
      });
    });

    expect(screen.getByTestId("infra-diagrams-question-text")).toHaveTextContent(question.questionText);
    expect(screen.queryByText(otherInferred.questionText)).not.toBeInTheDocument();
  });

  it("focuses the inferred question after dismiss when another open inferred row exists", async () => {
    const otherInferred = {
      ...question,
      resourceId:
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/other-resource",
      resourceName: "other-resource",
      questionText: "Should other-resource connect to a peer, or stand alone?",
      source: null,
      questionKey: "unresolved-host@v1",
      answerCodes: ["Yes", "No", "NotSure"],
    };
    const inferredQuestion = {
      ...question,
      source: null,
      questionKey: "unresolved-host@v1",
      answerCodes: ["Yes", "No", "NotSure"],
    };

    mocks.listQuestions
      .mockResolvedValueOnce([inferredQuestion, otherInferred])
      .mockResolvedValueOnce([inferredQuestion, otherInferred]);
    mocks.listConnections.mockResolvedValue([
      {
        connectionId: "connection-1",
        fromArmId: question.resourceId,
        ruleName: "Unresolved host",
      },
      {
        connectionId: "connection-2",
        fromArmId: otherInferred.resourceId,
        ruleName: "Unresolved host",
      },
    ]);
    mocks.dismissConnection.mockResolvedValue(undefined);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalledTimes(2));
    await waitFor(() => {
      expect(mocks.dismissConnection).toHaveBeenCalledWith("snapshot-1", {
        connectionId: "connection-1",
      });
    });

    expect(screen.getByTestId("infra-diagrams-question-text")).toHaveTextContent(question.questionText);
    expect(screen.queryByText(otherInferred.questionText)).not.toBeInTheDocument();
  });

  it("focuses the embedded-connection question after dismiss when another open inferred row exists", async () => {
    const embeddedConnectionId = "aabbccdd-eeff-0011-2233-445566778899";
    const otherConnectionId = "11223344-5566-7788-9900-aabbccddeeff";
    const otherInferred = {
      ...question,
      resourceId:
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/other-resource",
      resourceName: "other-resource",
      questionText: "Should other-resource connect to a peer, or stand alone?",
      source: "InferredConnection",
      questionKey: `inferred-11223344556677889900aabbccddeeff@v1`,
      answerCodes: ["Yes", "No", "NotSure"],
    };
    const inferredQuestion = {
      ...question,
      source: "InferredConnection",
      questionKey: `inferred-aabbccddeeff00112233445566778899@v1`,
      answerCodes: ["Yes", "No", "NotSure"],
    };

    mocks.listQuestions
      .mockResolvedValueOnce([inferredQuestion, otherInferred])
      .mockResolvedValueOnce([inferredQuestion, otherInferred]);
    mocks.listConnections.mockResolvedValue([
      {
        connectionId: embeddedConnectionId,
        fromArmId: question.resourceId,
        ruleName: "Embedded connection",
      },
      {
        connectionId: otherConnectionId,
        fromArmId: otherInferred.resourceId,
        ruleName: "Other embedded connection",
      },
    ]);
    mocks.dismissConnection.mockResolvedValue(undefined);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalledTimes(2));
    await waitFor(() => {
      expect(mocks.dismissConnection).toHaveBeenCalledWith("snapshot-1", {
        connectionId: embeddedConnectionId,
      });
    });

    expect(screen.getByTestId("infra-diagrams-question-text")).toHaveTextContent(question.questionText);
    expect(screen.queryByText(otherInferred.questionText)).not.toBeInTheDocument();
  });

  it("focuses the embedded-connection question after confirm when another open inferred row exists", async () => {
    const embeddedConnectionId = "aabbccdd-eeff-0011-2233-445566778899";
    const otherConnectionId = "11223344-5566-7788-9900-aabbccddeeff";
    const otherInferred = {
      ...question,
      resourceId:
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/other-resource",
      resourceName: "other-resource",
      questionText: "Should other-resource connect to a peer, or stand alone?",
      source: "InferredConnection",
      questionKey: `inferred-11223344556677889900aabbccddeeff@v1`,
      answerCodes: ["Yes", "No", "NotSure"],
    };
    const inferredQuestion = {
      ...question,
      source: "InferredConnection",
      questionKey: `inferred-aabbccddeeff00112233445566778899@v1`,
      answerCodes: ["Yes", "No", "NotSure"],
    };

    mocks.listQuestions
      .mockResolvedValueOnce([inferredQuestion, otherInferred])
      .mockResolvedValueOnce([inferredQuestion, otherInferred]);
    mocks.listConnections.mockResolvedValue([
      {
        connectionId: embeddedConnectionId,
        fromArmId: question.resourceId,
        ruleName: "Embedded connection",
      },
      {
        connectionId: otherConnectionId,
        fromArmId: otherInferred.resourceId,
        ruleName: "Other embedded connection",
      },
    ]);
    mocks.confirmConnection.mockResolvedValue(undefined);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalledTimes(2));
    await waitFor(() => {
      expect(mocks.confirmConnection).toHaveBeenCalledWith("snapshot-1", {
        connectionId: embeddedConnectionId,
      });
    });

    expect(screen.getByTestId("infra-diagrams-question-text")).toHaveTextContent(question.questionText);
    expect(screen.queryByText(otherInferred.questionText)).not.toBeInTheDocument();
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

  it("keeps a prior connection load warning visible while a post-answer reload is in flight", async () => {
    let resolvePostSaveQuestions!: (value: typeof question[]) => void;
    const postSaveQuestionsLoad = new Promise<typeof question[]>((resolve) => {
      resolvePostSaveQuestions = resolve;
    });

    mocks.listQuestions
      .mockResolvedValueOnce([question])
      .mockImplementationOnce(() => postSaveQuestionsLoad);
    mocks.listConnections
      .mockRejectedValueOnce(new Error("connections unavailable"))
      .mockResolvedValueOnce([]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    await waitFor(() => expect(screen.getByText("connections unavailable")).toBeInTheDocument());

    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    expect(screen.getByText("connections unavailable")).toBeInTheDocument();

    resolvePostSaveQuestions([{ ...question, status: "Answered", answerCode: "NamePeer" }]);
    await waitFor(() => {
      expect(screen.queryByText("connections unavailable")).not.toBeInTheDocument();
    });
  });

  it("clears a stale list-load error after a post-answer question reload succeeds", async () => {
    mocks.listQuestions
      .mockResolvedValueOnce([question])
      .mockRejectedValueOnce({
        message: "list refresh failed",
        problem: null,
        correlationId: null,
        httpStatus: 500,
        retryAfterSeconds: null,
      })
      .mockResolvedValueOnce([{ ...question, status: "Answered", answerCode: "NamePeer" }]);
    mocks.listConnections.mockResolvedValue([]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => expect(screen.getByText("list refresh failed")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => expect(screen.queryByText("list refresh failed")).not.toBeInTheDocument());
    expect(screen.getByTestId("infra-diagrams-question-disposition-status")).toHaveTextContent("Answered");
  });

  it("shows honest recovery when inferred connections fail after a post-answer reload", async () => {
    mocks.listQuestions
      .mockResolvedValueOnce([question])
      .mockResolvedValueOnce([{ ...question, status: "Answered", answerCode: "NamePeer" }]);
    mocks.listConnections
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error("connections refresh failed"));

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => expect(mocks.answerQuestion).toHaveBeenCalled());
    expect(await screen.findByText("connections refresh failed")).toBeInTheDocument();
    expect(screen.getByTestId("operator-error-recovery-intact")).toHaveTextContent(
      "Your SecureNow question list was refreshed after the update",
    );
    expect(screen.getByTestId("infra-diagrams-question-disposition-status")).toHaveTextContent("Answered");
  });

  it("keeps governance-mutation recovery when ignore throws ApiLoadFailureState", async () => {
    mocks.listQuestions.mockResolvedValue([question]);
    mocks.ignoreQuestion.mockRejectedValue(
      apiLoadFailure("Compiled question validation failed: reason required."),
    );

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Don't ask again" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Reason for not asking again" }), {
      target: { value: "Already covered in runbook." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByTestId("operator-mutation-inline-error")).toHaveTextContent(
      "Compiled question validation failed: reason required.",
    );
    expect(screen.getByTestId("operator-error-recovery-what-failed")).toHaveTextContent(
      "The governance change did not save.",
    );
  });

  it("keeps governance-mutation recovery when reopen throws ApiLoadFailureState", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        status: "Ignored",
        answerCode: null,
        answerText: null,
        reason: "Operator chose not to answer.",
      },
    ]);
    mocks.reopenQuestion.mockRejectedValue(
      apiLoadFailure("Question disposition was not found."),
    );

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Reason for reopening" }), {
      target: { value: "Needs another look." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reopen" }));

    expect(await screen.findByTestId("operator-mutation-inline-error")).toHaveTextContent(
      "Question disposition was not found.",
    );
    expect(screen.getByTestId("operator-error-recovery-what-failed")).toHaveTextContent(
      "The governance change did not save.",
    );
  });

  it("keeps governance-mutation recovery when save answer throws ApiLoadFailureState", async () => {
    mocks.listQuestions.mockResolvedValue([question]);
    mocks.answerQuestion.mockRejectedValue(
      apiLoadFailure("Compiled question validation failed: answer not in set."),
    );

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    expect(await screen.findByTestId("operator-mutation-inline-error")).toHaveTextContent(
      "Compiled question validation failed: answer not in set.",
    );
    expect(screen.getByTestId("operator-error-recovery-what-failed")).toHaveTextContent(
      "The governance change did not save.",
    );
  });

  it("keeps questions saveable when a post-answer reload fails", async () => {
    mocks.listQuestions
      .mockResolvedValueOnce([question])
      .mockRejectedValueOnce({
        message: "reload failed",
        problem: null,
        correlationId: null,
        httpStatus: 500,
        retryAfterSeconds: null,
      })
      .mockResolvedValueOnce([{ ...question, status: "Answered" }]);

    function QuestionsLoadedProbe() {
      const { questionsLoaded } = useSecureNowQuestionQueue();
      return (
        <div data-testid="questions-loaded-probe">{questionsLoaded ? "loaded" : "pending"}</div>
      );
    }

    function QueueWithLoadedProbe({ snapshotId }: { snapshotId: string }) {
      return (
        <SecureNowQuestionQueueProvider snapshotId={snapshotId}>
          <QuestionsLoadedProbe />
          <SecureNowQuestionQueueSnapshotPromo />
          <SecureNowQuestionQueueBar outline={null} />
        </SecureNowQuestionQueueProvider>
      );
    }

    render(<QueueWithLoadedProbe snapshotId="snapshot-1" />);
    await waitFor(() => expect(screen.getByTestId("questions-loaded-probe")).toHaveTextContent("loaded"));

    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => expect(screen.getByText("reload failed")).toBeInTheDocument());
    expect(screen.getByTestId("operator-error-recovery-intact")).toHaveTextContent(
      "Your disposition update may already be saved on the server",
    );
    expect(screen.getByTestId("questions-loaded-probe")).toHaveTextContent("loaded");

    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => expect(mocks.answerQuestion).toHaveBeenCalledTimes(2));
  });

  it("keeps the active snapshot loading state when a stale snapshot reload finishes first", async () => {
    const snapshotOneQuestion = {
      ...question,
      snapshotId: "snapshot-1",
    };
    let resolveAnswer!: () => void;
    let resolveSnapshotTwoLoad: ((value: typeof question[]) => void) | undefined;
    const snapshotTwoLoad = new Promise<typeof question[]>((resolve) => {
      resolveSnapshotTwoLoad = resolve;
    });

    mocks.listQuestions.mockImplementation(async (snapshotId: string) => {
      if (snapshotId === "snapshot-1") {
        return [snapshotOneQuestion];
      }

      if (snapshotId === "snapshot-2") {
        return snapshotTwoLoad;
      }

      return [];
    });
    mocks.answerQuestion.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveAnswer = () => resolve();
        }),
    );

    function LoadingProbe() {
      const { loading } = useSecureNowQuestionQueue();
      return (
        <div data-testid="securenow-queue-loading-probe">{loading ? "loading" : "idle"}</div>
      );
    }

    function QueueWithLoadingProbe({ snapshotId }: { snapshotId: string }) {
      return (
        <SecureNowQuestionQueueProvider snapshotId={snapshotId}>
          <LoadingProbe />
          <SecureNowQuestionQueueSnapshotPromo />
          <SecureNowQuestionQueueBar outline={null} />
        </SecureNowQuestionQueueProvider>
      );
    }

    const view = render(<QueueWithLoadingProbe snapshotId="snapshot-1" />);
    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalledWith("snapshot-1"));
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    view.rerender(<QueueWithLoadingProbe snapshotId="snapshot-2" />);
    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalledWith("snapshot-2"));
    expect(screen.getByTestId("securenow-queue-loading-probe")).toHaveTextContent("loading");

    resolveAnswer();
    await waitFor(() => expect(mocks.answerQuestion).toHaveBeenCalledWith("snapshot-1", expect.anything()));
    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalledTimes(3));

    expect(screen.getByTestId("securenow-queue-loading-probe")).toHaveTextContent("loading");

    resolveSnapshotTwoLoad?.([]);
    await waitFor(() => {
      expect(screen.getByTestId("securenow-queue-loading-probe")).toHaveTextContent("idle");
    });
  });

  it("does not apply a stale snapshot question reload after the active snapshot changes during save", async () => {
    const snapshotOneQuestion = {
      ...question,
      snapshotId: "snapshot-1",
      questionText: "Snapshot one question",
    };
    const snapshotTwoQuestion = {
      ...question,
      snapshotId: "snapshot-2",
      questionText: "Snapshot two question",
    };
    let resolveAnswer!: () => void;

    mocks.listQuestions.mockImplementation(async (snapshotId: string) => {
      if (snapshotId === "snapshot-1") {
        return [snapshotOneQuestion];
      }

      if (snapshotId === "snapshot-2") {
        return [snapshotTwoQuestion];
      }

      return [];
    });
    mocks.answerQuestion.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveAnswer = () => resolve();
        }),
    );

    const view = render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalledWith("snapshot-1"));
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    view.rerender(<SecureNowQuestionQueue snapshotId="snapshot-2" />);
    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalledWith("snapshot-2"));

    resolveAnswer();
    await waitFor(() => expect(mocks.answerQuestion).toHaveBeenCalledWith("snapshot-1", expect.anything()));

    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    expect(await screen.findByText("Snapshot two question")).toBeInTheDocument();
    expect(screen.queryByText("Snapshot one question")).not.toBeInTheDocument();

    mocks.answerQuestion.mockResolvedValue(undefined);
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => expect(mocks.answerQuestion).toHaveBeenCalledWith("snapshot-2", expect.anything()));
  });

  it("closes the question drawer when the active snapshot changes", async () => {
    mocks.listQuestions.mockResolvedValue([question]);

    const view = render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    expect(screen.getByTestId("infra-diagrams-question-bar")).toBeInTheDocument();

    view.rerender(<SecureNowQuestionQueue snapshotId="snapshot-2" />);

    await waitFor(() => {
      expect(screen.queryByTestId("infra-diagrams-question-bar")).not.toBeInTheDocument();
    });
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

  it("clears session skipped questions when review starts again", async () => {
    mocks.listQuestions.mockResolvedValue([question]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Not sure. This does not store an answer." }));

    expect(screen.queryByTestId("infra-diagrams-question-text")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Review questions" }));

    expect(await screen.findByTestId("infra-diagrams-question-text")).toHaveTextContent(
      question.questionText,
    );
  });

  it("clears the visit limit after the queue reloads", async () => {
    const manyQuestions = Array.from({ length: 11 }, (_, index) => ({
      ...question,
      resourceId:
        `/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/factory-${index}`,
      resourceName: `factory-${index}`,
      questionText: `Should factory-${index} connect to a peer, or stand alone?`,
    }));

    mocks.listQuestions
      .mockResolvedValueOnce(manyQuestions)
      .mockResolvedValueOnce(manyQuestions);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    const nextButton = screen.getByRole("button", { name: "Next" });
    for (let step = 0; step < 9; step += 1) {
      fireEvent.click(nextButton);
    }

    expect(nextButton).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalledTimes(2));

    expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();
  });

  it("clears the visit limit when review starts again", async () => {
    const manyQuestions = Array.from({ length: 11 }, (_, index) => ({
      ...question,
      resourceId:
        `/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/factory-${index}`,
      resourceName: `factory-${index}`,
      questionText: `Should factory-${index} connect to a peer, or stand alone?`,
    }));

    mocks.listQuestions.mockResolvedValue(manyQuestions);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    const nextButton = screen.getByRole("button", { name: "Next" });
    for (let step = 0; step < 9; step += 1) {
      fireEvent.click(nextButton);
    }

    expect(nextButton).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Review questions" }));

    expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();
  });

  it("restores session skipped questions after the queue reloads", async () => {
    const secondQuestion = {
      ...question,
      resourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/other-resource",
      resourceName: "other-resource",
      questionText: "Should other-resource connect to a peer, or stand alone?",
      reasonText:
        "SecureNow found no connection to or from other-resource. Data factory is not treated as a shared service that can stand alone.",
    };

    mocks.listQuestions
      .mockResolvedValueOnce([question, secondQuestion])
      .mockResolvedValueOnce([question]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Not sure. This does not store an answer." }));

    expect(
      await screen.findByText("Should other-resource connect to a peer, or stand alone?"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalledTimes(2));

    expect(await screen.findByTestId("infra-diagrams-question-text")).toHaveTextContent(
      question.questionText,
    );
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

  it("does not warn about resource id for subscription-scope pack rows with an empty listed resource id", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        resourceId: "",
        scopeKind: "Subscription",
        source: "PolicyPack",
        questionKey: "subscription-ownership@v1",
        questionText: "Who owns this subscription workload?",
        answerCodes: ["Register", "Keep"],
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(screen.queryByText("Resource id was not stored.")).not.toBeInTheDocument();
    expect(screen.queryByText("Resource id was stored empty.")).not.toBeInTheDocument();
  });

  it("does not warn that resource id was missing for subscription-scope pack rows with null resource id", async () => {
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

    expect(screen.queryByText("Resource id was not stored.")).not.toBeInTheDocument();
    expect(screen.queryByText("Resource id was stored empty.")).not.toBeInTheDocument();
  });

  it("routes unknown status with stored answer metadata into the answered filter", async () => {
    mocks.listQuestions.mockResolvedValue([
      { ...question, status: "Open" },
      {
        ...question,
        status: "Pending",
        answerCode: "NamePeer",
        answerText: "Name the peer",
        reason: "Operator selected the peer.",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Answered" }));

    expect(screen.getByTestId("infra-diagrams-question-disposition-status")).toHaveTextContent("Answered");
    expect(screen.getByTestId("infra-diagrams-question-answer")).toHaveTextContent("Name the peer");
    expect(screen.queryByRole("button", { name: "Name the peer" })).not.toBeInTheDocument();
  });

  it("shows the review promo and opens answered when only closed disposition rows are reviewable", async () => {
    mocks.listQuestions.mockResolvedValue([{
      ...question,
      status: "Pending",
      answerCode: "NamePeer",
      answerText: "Name the peer",
      reason: "Operator selected the peer.",
    }]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);

    expect(await screen.findByTestId("infra-diagrams-question-snapshot-promo")).toBeInTheDocument();
    expect(screen.getByText("1 question to review")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Review questions" }));

    expect(screen.getByTestId("infra-diagrams-question-disposition-status")).toHaveTextContent("Answered");
    expect(screen.getByTestId("infra-diagrams-question-answer")).toHaveTextContent("Name the peer");
  });

  it("shows the review promo and opens dismissed when only dismiss disposition rows are reviewable", async () => {
    mocks.listQuestions.mockResolvedValue([{
      ...question,
      status: null,
      answerCode: null,
      answerText: null,
      reason: "Operator chose not to answer.",
    }]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);

    expect(await screen.findByTestId("infra-diagrams-question-snapshot-promo")).toBeInTheDocument();
    expect(screen.getByText("1 question to review")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Review questions" }));

    expect(screen.getByTestId("infra-diagrams-question-disposition-status")).toHaveTextContent("Dismissed");
    expect(screen.getByRole("button", { name: "Reopen" })).toBeInTheDocument();
  });

  it("routes Ignored disposition status into the dismissed filter", async () => {
    mocks.listQuestions.mockResolvedValue([{
      ...question,
      status: "Ignored",
      answerCode: null,
      answerText: null,
      reason: "Operator chose not to answer.",
    }]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(screen.getByTestId("infra-diagrams-question-disposition-status")).toHaveTextContent("Dismissed");
    expect(screen.getByRole("button", { name: "Reopen" })).toBeInTheDocument();
  });

  it("focuses the reopened question after reload when another open row exists", async () => {
    const otherOpen = {
      ...question,
      resourceId:
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/other-resource",
      resourceName: "other-resource",
      questionText: "Should other-resource connect to a peer, or stand alone?",
      reasonText:
        "SecureNow found no connection to or from other-resource. Data factory is not treated as a shared service that can stand alone.",
    };
    const dismissedRow = {
      ...question,
      status: "Ignored",
      answerCode: null,
      answerText: null,
      reason: "Operator chose not to answer.",
    };

    mocks.listQuestions
      .mockResolvedValueOnce([otherOpen, dismissedRow])
      .mockResolvedValueOnce([otherOpen, { ...question, status: "Open", reason: null }]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismissed" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Reason for reopening" }), {
      target: { value: "Still needs review." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reopen" }));

    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(mocks.reopenQuestion).toHaveBeenCalled());

    expect(screen.getByTestId("infra-diagrams-question-disposition-status")).toHaveTextContent("Open");
    expect(screen.getByTestId("infra-diagrams-question-text")).toHaveTextContent(question.questionText);
    expect(screen.queryByText("Should other-resource connect to a peer, or stand alone?")).not.toBeInTheDocument();
  });

  it("routes to dismissed when open filter empties after saving an ignore", async () => {
    const answeredRow = {
      ...question,
      resourceId:
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/other-resource",
      resourceName: "other-resource",
      questionText: "Should other-resource connect to a peer, or stand alone?",
      status: "Answered",
      answerCode: "NamePeer",
      answerText: "Name the peer",
      reason: "Operator selected the peer.",
    };
    const dismissedRow = {
      ...question,
      status: "Ignored",
      answerCode: null,
      answerText: null,
      reason: "Operator chose not to answer.",
    };

    mocks.listQuestions
      .mockResolvedValueOnce([question, answeredRow])
      .mockResolvedValueOnce([dismissedRow, answeredRow]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Don't ask again" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Reason for not asking again" }), {
      target: { value: "Operator chose not to answer." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalledTimes(2));

    expect(screen.getByTestId("infra-diagrams-question-disposition-status")).toHaveTextContent("Dismissed");
    expect(screen.getByTestId("infra-diagrams-question-text")).toHaveTextContent(question.questionText);
    expect(screen.queryByText("No questions match this filter.")).not.toBeInTheDocument();
  });

  it("routes to answered when open filter empties after saving an answer", async () => {
    const answeredRow = {
      ...question,
      status: "Answered",
      answerCode: "NamePeer",
      answerText: "Name the peer",
      reason: "Operator selected the peer.",
    };

    mocks.listQuestions
      .mockResolvedValueOnce([question, answeredRow])
      .mockResolvedValueOnce([answeredRow]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalledTimes(2));

    expect(screen.getByTestId("infra-diagrams-question-disposition-status")).toHaveTextContent("Answered");
    expect(screen.getByTestId("infra-diagrams-question-answer")).toHaveTextContent("Name the peer");
    expect(screen.queryByText("No questions match this filter.")).not.toBeInTheDocument();
  });

  it("focuses the dismissed question after reload when another dismissed row exists", async () => {
    const dismissedRow = {
      ...question,
      status: "Ignored",
      answerCode: null,
      answerText: null,
      reason: "Already dismissed earlier.",
    };
    const otherOpen = {
      ...question,
      resourceId:
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/other-resource",
      resourceName: "other-resource",
      questionText: "Should other-resource connect to a peer, or stand alone?",
      reasonText:
        "SecureNow found no connection to or from other-resource. Data factory is not treated as a shared service that can stand alone.",
    };

    mocks.listQuestions
      .mockResolvedValueOnce([dismissedRow, otherOpen])
      .mockResolvedValueOnce([
        dismissedRow,
        {
          ...otherOpen,
          status: "Ignored",
          answerCode: null,
          answerText: null,
          reason: "Operator chose not to answer.",
        },
      ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Don't ask again" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Reason for not asking again" }), {
      target: { value: "Operator chose not to answer." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(mocks.ignoreQuestion).toHaveBeenCalled());

    expect(screen.getByTestId("infra-diagrams-question-disposition-status")).toHaveTextContent("Dismissed");
    expect(screen.getByTestId("infra-diagrams-question-text")).toHaveTextContent(otherOpen.questionText);
    expect(screen.queryByText(question.questionText)).not.toBeInTheDocument();
  });

  it("keeps focus on the saved question when the answered filter omits a stale open row after save", async () => {
    const answeredRow = {
      ...question,
      resourceId:
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/other-resource",
      resourceName: "other-resource",
      questionText: "Should other-resource connect to a peer, or stand alone?",
      reasonText:
        "SecureNow found no connection to or from other-resource. Data factory is not treated as a shared service that can stand alone.",
      status: "Answered",
      answerCode: "NamePeer",
      answerText: "Name the peer",
      reason: "Operator selected the peer.",
    };

    mocks.listQuestions
      .mockResolvedValueOnce([question, answeredRow])
      .mockResolvedValueOnce([question, answeredRow]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => expect(mocks.answerQuestion).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Open" }).className).toContain("al-primary-action-bg");
    expect(screen.getByTestId("infra-diagrams-question-text")).toHaveTextContent(question.questionText);
    expect(screen.queryByText(answeredRow.questionText)).not.toBeInTheDocument();
  });

  it("keeps focus on the ignored question when the dismissed filter omits a stale open row after save", async () => {
    const dismissedRow = {
      ...question,
      resourceId:
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/other-resource",
      resourceName: "other-resource",
      questionText: "Should other-resource connect to a peer, or stand alone?",
      reasonText:
        "SecureNow found no connection to or from other-resource. Data factory is not treated as a shared service that can stand alone.",
      status: "Ignored",
      answerCode: null,
      answerText: null,
      reason: "Operator chose not to answer earlier.",
    };

    mocks.listQuestions
      .mockResolvedValueOnce([question, dismissedRow])
      .mockResolvedValueOnce([question, dismissedRow]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Don't ask again" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Reason for not asking again" }), {
      target: { value: "Operator chose not to answer." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(mocks.ignoreQuestion).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Open" }).className).toContain("al-primary-action-bg");
    expect(screen.getByTestId("infra-diagrams-question-text")).toHaveTextContent(question.questionText);
    expect(screen.queryByText(dismissedRow.questionText)).not.toBeInTheDocument();
  });

  it("keeps focus on the reopened question when the open filter omits a stale ignored row after save", async () => {
    const otherOpen = {
      ...question,
      resourceId:
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/other-resource",
      resourceName: "other-resource",
      questionText: "Should other-resource connect to a peer, or stand alone?",
      reasonText:
        "SecureNow found no connection to or from other-resource. Data factory is not treated as a shared service that can stand alone.",
    };
    const dismissedRow = {
      ...question,
      status: "Ignored",
      answerCode: null,
      answerText: null,
      reason: "Operator chose not to answer.",
    };

    mocks.listQuestions
      .mockResolvedValueOnce([otherOpen, dismissedRow])
      .mockResolvedValueOnce([otherOpen, dismissedRow]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismissed" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Reason for reopening" }), {
      target: { value: "Still needs review." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reopen" }));

    await waitFor(() => expect(mocks.reopenQuestion).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Dismissed" }).className).toContain("al-primary-action-bg");
    expect(screen.getByTestId("infra-diagrams-question-text")).toHaveTextContent(question.questionText);
    expect(screen.queryByText(otherOpen.questionText)).not.toBeInTheDocument();
  });

  it("focuses the answered question after reload when another answered row exists", async () => {
    const answeredRow = {
      ...question,
      status: "Answered",
      answerCode: "NamePeer",
      answerText: "Name the peer",
      reason: "Operator selected the peer.",
    };
    const otherOpen = {
      ...question,
      resourceId:
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/other-resource",
      resourceName: "other-resource",
      questionText: "Should other-resource connect to a peer, or stand alone?",
      reasonText:
        "SecureNow found no connection to or from other-resource. Data factory is not treated as a shared service that can stand alone.",
    };

    mocks.listQuestions
      .mockResolvedValueOnce([answeredRow, otherOpen])
      .mockResolvedValueOnce([
        answeredRow,
        {
          ...otherOpen,
          status: "Answered",
          answerCode: "StandsAlone",
          answerText: "Stands alone",
          reason: "Operator selected stands alone.",
        },
      ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "It stands alone" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(mocks.answerQuestion).toHaveBeenCalled());

    expect(screen.getByTestId("infra-diagrams-question-disposition-status")).toHaveTextContent("Answered");
    expect(screen.getByTestId("infra-diagrams-question-text")).toHaveTextContent(otherOpen.questionText);
    expect(screen.queryByText(question.questionText)).not.toBeInTheDocument();
  });

  it("resets ignore chrome after the queue reloads", async () => {
    const secondQuestion = {
      ...question,
      resourceId:
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/other-resource",
      resourceName: "other-resource",
      questionText: "Should other-resource connect to a peer, or stand alone?",
      reasonText:
        "SecureNow found no connection to or from other-resource. Data factory is not treated as a shared service that can stand alone.",
    };

    mocks.listQuestions
      .mockResolvedValueOnce([question, secondQuestion])
      .mockResolvedValueOnce([secondQuestion]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Don't ask again" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Reason for not asking again" }), {
      target: { value: "Reviewed with the subscription owner." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalledTimes(2));

    expect(
      await screen.findByText("Should other-resource connect to a peer, or stand alone?"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Reason for not asking again" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Name the peer" })).toBeInTheDocument();
  });

  it("clears draft ignore state when moving to the next question", async () => {
    const secondQuestion = {
      ...question,
      resourceId:
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/other-resource",
      resourceName: "other-resource",
      questionText: "Should other-resource connect to a peer, or stand alone?",
      reasonText:
        "SecureNow found no connection to or from other-resource. Data factory is not treated as a shared service that can stand alone.",
    };

    mocks.listQuestions.mockResolvedValue([question, secondQuestion]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Don't ask again" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Reason for not asking again" }), {
      target: { value: "Draft ignore reason" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(
      await screen.findByText("Should other-resource connect to a peer, or stand alone?"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Reason for not asking again" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Name the peer" })).toBeInTheDocument();
  });

  it("clears draft reason when switching question filters", async () => {
    mocks.listQuestions.mockResolvedValue([
      question,
      {
        ...question,
        status: "Answered",
        answerCode: "NamePeer",
        answerText: "Name the peer",
        reason: "Operator selected the peer.",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Don't ask again" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Reason for not asking again" }), {
      target: { value: "Draft ignore reason" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Answered" }));

    expect(screen.getByRole("textbox", { name: "Reason for reopening" })).toHaveValue("");
  });

  it("hides the open promo when every listed question has unknown disposition status", async () => {
    mocks.listQuestions.mockResolvedValue([{ ...question, status: "Pending" }]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);

    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalled());
    expect(screen.queryByTestId("infra-diagrams-question-snapshot-promo")).not.toBeInTheDocument();
  });

  it("hides expired questions from the open promo when isExpired is true", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        isExpired: true,
        expirationUtc: "2099-01-01T00:00:00.000Z",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);

    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalled());
    expect(screen.queryByTestId("infra-diagrams-question-snapshot-promo")).not.toBeInTheDocument();
  });

  it("hides expired questions from the open promo when expirationUtc is past but isExpired is null", async () => {
    vi.setSystemTime(new Date("2026-10-25T12:00:00.000Z"));
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        isExpired: null,
        expirationUtc: "2026-10-25T11:00:00.000Z",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);

    await waitFor(() => expect(mocks.listQuestions).toHaveBeenCalled());
    expect(screen.queryByTestId("infra-diagrams-question-snapshot-promo")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("posts trimmed answer codes when list JSON stored padded answer choices", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        answerCodes: ["  NamePeer  ", " StandsAlone ", "NotSure"],
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => {
      expect(mocks.answerQuestion).toHaveBeenCalledWith("snapshot-1", expect.objectContaining({
        answerCode: "NamePeer",
        answerText: "NamePeer",
      }));
    });
  });

  it("passes expectedListedDispositionId when the focused question already has a disposition id", async () => {
    const listedDispositionId = "00000000-0000-0000-0000-000000000099";
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        dispositionId: listedDispositionId,
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => {
      expect(mocks.answerQuestion).toHaveBeenCalledWith(
        "snapshot-1",
        expect.objectContaining({
          answerCode: "NamePeer",
        }),
        { expectedListedDispositionId: listedDispositionId },
      );
    });
  });

  it("does not post an answer when the listed snapshot id is whitespace only", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        snapshotId: "   ",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => {
      expect(screen.getByTestId("operator-mutation-inline-error")).toHaveTextContent(
        "Listed snapshot id does not match the active evidence snapshot.",
      );
    });
    expect(mocks.answerQuestion).not.toHaveBeenCalled();
  });

  it("does not post an answer when the listed snapshot id is empty", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        snapshotId: "",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => {
      expect(screen.getByTestId("operator-mutation-inline-error")).toHaveTextContent(
        "Listed snapshot id does not match the active evidence snapshot.",
      );
    });
    expect(mocks.answerQuestion).not.toHaveBeenCalled();
  });

  it("does not post an answer when the listed snapshot id differs from the active snapshot", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        snapshotId: "snapshot-2",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => {
      expect(screen.getByTestId("operator-mutation-inline-error")).toHaveTextContent(
        "Listed snapshot id does not match the active evidence snapshot.",
      );
    });
    expect(mocks.answerQuestion).not.toHaveBeenCalled();
  });

  it("does not post an ignore when the listed snapshot id differs from the active snapshot", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        snapshotId: "snapshot-2",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Don't ask again" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Reason for not asking again" }), {
      target: { value: "Already reviewed." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByTestId("operator-mutation-inline-error")).toHaveTextContent(
        "Listed snapshot id does not match the active evidence snapshot.",
      );
    });
    expect(mocks.ignoreQuestion).not.toHaveBeenCalled();
  });

  it("does not post a reopen when the listed snapshot id differs from the active snapshot", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        snapshotId: "snapshot-2",
        status: "Ignored",
        reason: "Operator chose not to answer.",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismissed" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Reason for reopening" }), {
      target: { value: "Needs another look." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reopen" }));

    await waitFor(() => {
      expect(screen.getByTestId("operator-mutation-inline-error")).toHaveTextContent(
        "Listed snapshot id does not match the active evidence snapshot.",
      );
    });
    expect(mocks.reopenQuestion).not.toHaveBeenCalled();
  });

  it("clears a mutation inline error when advancing to another question in the drawer", async () => {
    const mismatchedSnapshotQuestion = {
      ...question,
      snapshotId: "snapshot-2",
      questionText: "Should the mismatched snapshot row connect to a peer, or stand alone?",
    };
    const validQuestion = {
      ...question,
      questionKey: "other-evidence@v1",
      questionText: "Should adf-edw-hi-dev connect to a peer, or stand alone?",
    };

    mocks.listQuestions.mockResolvedValue([mismatchedSnapshotQuestion, validQuestion]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => {
      expect(screen.getByTestId("operator-mutation-inline-error")).toHaveTextContent(
        "Listed snapshot id does not match the active evidence snapshot.",
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.queryByTestId("operator-mutation-inline-error")).not.toBeInTheDocument();
    });
  });

  it("answers when list snapshot id is padded but matches the active snapshot", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        snapshotId: "  snapshot-1  ",
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Name the peer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save answer" }));

    await waitFor(() => {
      expect(mocks.answerQuestion).toHaveBeenCalledWith("snapshot-1", expect.objectContaining({
        questionKey: "unknown-evidence@v1",
      }));
    });
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

  it("answers a resource-group pack question when scopeKind is null", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        resourceId: null,
        scopeKind: null,
        source: "PolicyPack",
        questionKey: "rg-scope@v1",
        questionText: "Which resource group owns this workload?",
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
        questionKey: "rg-scope@v1",
        source: "PolicyPack",
        scopeKind: "ResourceGroup",
        answerCode: "Register",
        answerText: "Register",
        reason: "Answered in the SecureNow subscription question queue.",
        evidenceFingerprint: "fingerprint",
      });
    });
  });

  it("labels policy pack source in details when source is omitted on resource-group scope rows", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        resourceId: null,
        scopeKind: "ResourceGroup",
        source: null,
        questionKey: "rg-scope@v1",
        questionText: "Which resource group owns this workload?",
        answerCodes: ["Register", "Keep"],
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(screen.getByText("Source: Question source was not stored.")).toBeInTheDocument();
    expect(screen.queryByText("Source: Asked from an assigned policy pack.")).not.toBeInTheDocument();
  });

  it("labels policy pack source in details when source is omitted on subscription-scope rows", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        resourceId: null,
        scopeKind: "Subscription",
        source: null,
        questionKey: "subscription-ownership@v1",
        questionText: "Who owns this subscription workload?",
        answerCodes: ["Register", "Keep"],
      },
    ]);

    render(<SecureNowQuestionQueue snapshotId="snapshot-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Review questions" }));

    expect(screen.getByText("Source: Question source was not stored.")).toBeInTheDocument();
    expect(screen.queryByText("Source: Asked from an assigned policy pack.")).not.toBeInTheDocument();
  });

  it("answers a subscription-scope pack question when source is null", async () => {
    mocks.listQuestions.mockResolvedValue([
      {
        ...question,
        resourceId: null,
        scopeKind: "Subscription",
        source: null,
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
