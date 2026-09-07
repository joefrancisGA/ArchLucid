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

vi.mock("@/lib/architecture/architecture-creation-init", () => ({
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

vi.mock("@/app/(operator)/architecture/reviews/new/SocraticIntakeWizardDeferredPanels", () => ({
  DraftIntakeDecisionReceiptCard: () => null,
  SocraticIntakeWizardAdvancedRail: () => null,
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

import { SocraticIntakeWizard } from "@/app/(operator)/architecture/reviews/new/SocraticIntakeWizard";
import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture/architecture-workflow-intent";
import {
  GUIDED_INTAKE_CONTINUE_TO_DISCOVERY,
  GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_LABEL,
  GUIDED_INTAKE_CREATION_SYSTEM_NAME_LABEL,
} from "@/lib/guided-intake-copy";

const validIntent =
  "We are designing a structured workflow platform for analysts with Entra ID authentication, auditable evidence trails, and exportable architecture reviews.";

const validOutcome = "Reduce cycle time for architecture reviews.";
const validSystemName = "Formal review platform";

function fillCreateArchitectureMinimumFields(): void {
  fireEvent.change(screen.getByTestId("socratic-system-name"), { target: { value: validSystemName } });
  fireEvent.change(screen.getByTestId("socratic-intent"), { target: { value: validIntent } });
  fireEvent.change(screen.getByTestId("socratic-outcome"), { target: { value: validOutcome } });
}

/** Editing any intake field re-derives the scope rows and reopens the gate, so confirm last. */
function confirmStep0Scope(): void {
  fireEvent.click(screen.getByTestId("architecture-scope-understanding-confirm"));
}

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

  it("uses create-architecture labels and shows wizard progress", () => {
    render(<SocraticIntakeWizard />);

    expect(screen.getByLabelText(`${GUIDED_INTAKE_CREATION_SYSTEM_NAME_LABEL} (required)`)).toBeInTheDocument();
    expect(screen.getByLabelText(`${GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_LABEL} (required)`)).toBeInTheDocument();
    expect(screen.getByTestId("wizard-sticky-progress")).toHaveTextContent(/step 1 of 3/i);
    expect(screen.queryByTestId("draft-intake-claim-label-architecture-creation-draft")).not.toBeInTheDocument();
    expect(screen.getByTestId("pilot-mode-policy-pack-toggle-selected-standards")).toBeInTheDocument();
  });

  it("places system name before architecture overview", () => {
    render(<SocraticIntakeWizard />);

    const systemName = screen.getByTestId("socratic-system-name");
    const overview = screen.getByTestId("socratic-intent");

    expect(
      systemName.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("allows continuing without actors when name, overview, and outcome are complete", async () => {
    render(<SocraticIntakeWizard />);

    fillCreateArchitectureMinimumFields();
    confirmStep0Scope();

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
    expect(screen.getByTestId("socratic-advance-hint")).toHaveTextContent(/system name/i);
    expect(screen.getByTestId("socratic-advance-hint")).toHaveTextContent(/architecture overview/i);
  });

  it("blocks continue when system name is missing", () => {
    render(<SocraticIntakeWizard />);

    fireEvent.change(screen.getByTestId("socratic-intent"), { target: { value: validIntent } });
    fireEvent.change(screen.getByTestId("socratic-outcome"), { target: { value: validOutcome } });

    expect(screen.getByRole("button", { name: GUIDED_INTAKE_CONTINUE_TO_DISCOVERY })).toBeDisabled();
    expect(screen.getByTestId("socratic-advance-hint")).toHaveTextContent(/system name/i);
  });

  it("allows adding people or systems before the overview is complete", () => {
    render(<SocraticIntakeWizard />);

    const addButton = screen.getByTestId("draft-intake-actor-stub-add");
    expect(addButton).toBeEnabled();
  });

  it("continues to discovery questions with getDraftQuestions instead of admitDraftRequest", async () => {
    render(<SocraticIntakeWizard />);

    fillCreateArchitectureMinimumFields();
    fireEvent.click(screen.getByTestId("draft-intake-actor-stub-add"));
    confirmStep0Scope();

    fireEvent.click(screen.getByRole("button", { name: GUIDED_INTAKE_CONTINUE_TO_DISCOVERY }));

    await waitFor(() => {
      expect(getDraftQuestions).toHaveBeenCalledWith("draft-session");
    });

    expect(admitDraftRequest).not.toHaveBeenCalled();
  });
});
