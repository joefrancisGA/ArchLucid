import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const admitDraftRequest = vi.fn();
const createDraftRequest = vi.fn();
const getDraftQuestions = vi.fn();
const patchDraftRequest = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/hooks/use-llm-monthly-budget-execution-gate", () => ({
  useLlmMonthlyBudgetExecutionGate: () => ({
    llmBudgetStatus: null,
    blocksLlmExecution: false,
  }),
}));

vi.mock("@/lib/api/draft-intake-api", () => ({
  admitDraftRequest: (...args: unknown[]) => admitDraftRequest(...args),
  createDraftRequest: (...args: unknown[]) => createDraftRequest(...args),
  patchDraftRequest: (...args: unknown[]) => patchDraftRequest(...args),
  getDraftQuestions: (...args: unknown[]) => getDraftQuestions(...args),
  answerDraftQuestion: vi.fn(),
  skipDraftQuestion: vi.fn(),
  submitDraftRequest: vi.fn(),
  buildDefaultActorSet: () => ({
    actors: [{ kind: "Human", trustOrigin: "Internal", contract: "Sync", origin: "Asserted", confidence: 100 }],
  }),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

import { SocraticIntakeWizard } from "./SocraticIntakeWizard";

describe("SocraticIntakeWizard", () => {
  it("creates, patches, and admits a draft when intent and outcome are provided", async () => {
    createDraftRequest.mockResolvedValue({ draftId: "draft-1" });
    patchDraftRequest.mockResolvedValue({ draftId: "draft-1", status: "Drafting" });
    admitDraftRequest.mockResolvedValue({
      admitted: true,
      pendingMustQuestions: [],
      draft: { draftId: "draft-1" },
      verdict: { kind: "Feasible", summary: "ok" },
    });
    getDraftQuestions.mockResolvedValue({
      draftId: "draft-1",
      status: "Admitted",
      selection: { allQuestions: [], requiredMustQuestionKeys: [], pendingMustQuestions: [] },
    });

    render(<SocraticIntakeWizard />);

    fireEvent.change(screen.getByTestId("socratic-intent"), {
      target: { value: "Modernize the claims intake workflow for analysts." },
    });
    fireEvent.change(screen.getByTestId("socratic-outcome"), {
      target: { value: "Reduce manual triage time by thirty percent." },
    });
    fireEvent.click(screen.getByTestId("socratic-admit"));

    await waitFor(() => {
      expect(createDraftRequest).toHaveBeenCalled();
      expect(patchDraftRequest).toHaveBeenCalled();
      expect(admitDraftRequest).toHaveBeenCalledWith("draft-1");
    });

    expect(screen.getByTestId("socratic-intake-progress")).toHaveTextContent(/step 2 of 3/i);
  });
});
