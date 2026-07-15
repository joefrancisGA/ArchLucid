import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const admitDraftRequest = vi.fn();
const createDraftRequest = vi.fn();
const getDraftQuestions = vi.fn();
const patchDraftRequest = vi.fn();
const initializeArchitectureCreation = vi.fn();
const searchParamsGet = vi.hoisted(() => vi.fn(() => null as string | null));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useRouter: () => ({ push: vi.fn() }),
    useSearchParams: () => ({ get: (key: string) => searchParamsGet(key) }),
  };
});

vi.mock("@/hooks/use-llm-monthly-budget-execution-gate", () => ({
  useLlmMonthlyBudgetExecutionGate: () => ({
    loading: false,
    status: null,
    blocksLlmExecution: false,
  }),
}));

vi.mock("@/lib/architecture-creation-init", () => ({
  initializeArchitectureCreation: (...args: unknown[]) => initializeArchitectureCreation(...args),
  applyArchitectureCreationDraftToFormState: () => ({
    freeTextIntent: "",
    businessOutcome: "",
    systemName: "",
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
}));

vi.mock("@/components/draft-intake/DraftIntakeActorEditor", () => ({
  DraftIntakeActorEditor: ({
    onChange,
    disabled,
  }: {
    disabled?: boolean;
    onChange: (actorSet: {
      actors: Array<{
        label: string;
        kind: "Human";
        trustOrigin: "Internal";
        contract: "Sync";
        origin: "Asserted";
        confidence: 100;
      }>;
    }) => void;
  }) => (
    <button
      type="button"
      data-testid="draft-intake-actor-stub-add"
      disabled={disabled}
      onClick={() => {
        onChange({
          actors: [
            {
              label: "Ops user",
              kind: "Human",
              trustOrigin: "Internal",
              contract: "Sync",
              origin: "Asserted",
              confidence: 100,
            },
          ],
        });
      }}
    >
      Stub add person or system
    </button>
  ),
}));

vi.mock("@/app/(operator)/reviews/new/SocraticIntakeWizardDeferredPanels", () => ({
  DraftIntakeDecisionReceiptCard: () => null,
  SocraticIntakeWizardAdvancedRail: () => null,
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

import { SocraticIntakeWizard } from "@/app/(operator)/reviews/new/SocraticIntakeWizard";
import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture-workflow-intent";
import {
  GUIDED_INTAKE_CONTINUE_TO_DISCOVERY,
  GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_LABEL,
} from "@/lib/guided-intake-copy";

const validIntent =
  "We are designing a governed workflow platform for analysts with Entra ID authentication, auditable evidence trails, and exportable architecture reviews.";

describe("SocraticIntakeWizard create-architecture intent", () => {
  beforeEach(() => {
    admitDraftRequest.mockReset();
    createDraftRequest.mockReset();
    getDraftQuestions.mockReset();
    patchDraftRequest.mockReset();
    initializeArchitectureCreation.mockReset();
    searchParamsGet.mockImplementation((key: string) => (key === "intent" ? CREATE_ARCHITECTURE_INTENT : null));
    initializeArchitectureCreation.mockResolvedValue({
      draftId: "draft-session",
      draft: null,
      questionSelection: {
        allQuestions: [{ questionKey: "l0.pillar.security", prompt: "Security?", tier: "Must", answerKind: "Text", source: "L0Universal", ruleKeys: [] }],
        requiredMustQuestionKeys: ["l0.pillar.security"],
        pendingMustQuestions: [{ questionKey: "l0.pillar.security", prompt: "Security?", tier: "Must", answerKind: "Text", source: "L0Universal", ruleKeys: [] }],
      },
      timings: {},
    });
    createDraftRequest.mockResolvedValue({ draftId: "draft-session" });
    patchDraftRequest.mockResolvedValue({});
    getDraftQuestions.mockResolvedValue({
      selection: {
        allQuestions: [{ questionKey: "l0.pillar.security", prompt: "Security?", tier: "Must", answerKind: "Text", source: "L0Universal", ruleKeys: [] }],
        requiredMustQuestionKeys: ["l0.pillar.security"],
        pendingMustQuestions: [{ questionKey: "l0.pillar.security", prompt: "Security?", tier: "Must", answerKind: "Text", source: "L0Universal", ruleKeys: [] }],
      },
    });
  });

  it("preloads deterministic creation questions without review admission", async () => {
    render(<SocraticIntakeWizard />);

    await waitFor(() => {
      expect(initializeArchitectureCreation).toHaveBeenCalledTimes(1);
    });

    expect(admitDraftRequest).not.toHaveBeenCalled();
  });

  it("uses create-architecture labels and hides redundant draft callouts", () => {
    render(<SocraticIntakeWizard />);

    expect(screen.getByLabelText(`${GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_LABEL} (required)`)).toBeInTheDocument();
    expect(screen.queryByTestId("socratic-intake-progress")).not.toBeInTheDocument();
    expect(screen.queryByTestId("draft-intake-claim-label-architecture-creation-draft")).not.toBeInTheDocument();
    expect(screen.getByTestId("pilot-mode-policy-pack-toggle-selected-standards")).toBeInTheDocument();
  });

  it("allows continuing without actors when overview and outcome are complete", async () => {
    render(<SocraticIntakeWizard />);

    fireEvent.change(screen.getByTestId("socratic-intent"), { target: { value: validIntent } });
    fireEvent.change(screen.getByTestId("socratic-outcome"), {
      target: { value: "Reduce cycle time for governed architecture reviews." },
    });

    const continueButton = screen.getByRole("button", { name: GUIDED_INTAKE_CONTINUE_TO_DISCOVERY });
    expect(continueButton).toBeEnabled();

    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(getDraftQuestions).toHaveBeenCalledWith("draft-session");
    });

    expect(admitDraftRequest).not.toHaveBeenCalled();
  });

  it("shows field-level validation instead of only disabling continue", () => {
    render(<SocraticIntakeWizard />);

    fireEvent.change(screen.getByTestId("socratic-intent"), { target: { value: "Too short." } });

    expect(screen.getByRole("button", { name: GUIDED_INTAKE_CONTINUE_TO_DISCOVERY })).toBeDisabled();
    expect(screen.getByTestId("socratic-advance-hint")).toHaveTextContent(/architecture overview/i);
  });

  it("allows adding people or systems before the overview is complete", () => {
    render(<SocraticIntakeWizard />);

    const addButton = screen.getByTestId("draft-intake-actor-stub-add");
    expect(addButton).toBeEnabled();
  });

  it("continues to discovery questions with getDraftQuestions instead of admitDraftRequest", async () => {
    render(<SocraticIntakeWizard />);

    fireEvent.change(screen.getByTestId("socratic-intent"), { target: { value: validIntent } });
    fireEvent.change(screen.getByTestId("socratic-outcome"), {
      target: { value: "Reduce cycle time for governed architecture reviews." },
    });
    fireEvent.click(screen.getByTestId("draft-intake-actor-stub-add"));

    fireEvent.click(screen.getByRole("button", { name: GUIDED_INTAKE_CONTINUE_TO_DISCOVERY }));

    await waitFor(() => {
      expect(getDraftQuestions).toHaveBeenCalledWith("draft-session");
    });

    expect(admitDraftRequest).not.toHaveBeenCalled();
  });
});
