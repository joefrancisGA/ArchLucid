import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DECISION_REGISTER_VIEW_CARDS_LABEL,
  DECISION_REGISTER_VIEW_TIMELINE_LABEL,
} from "./decision-register-copy";
import DecisionRegisterClient from "./DecisionRegisterClient";

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  getArchitectureDecisionRegister: vi.fn(),
}));

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  getEffectiveBrowserProxyScopeHeaders: () => ({}),
}));

vi.mock("@/lib/operator/operator-resource-scope", () => ({
  projectIdFromScopeHeaders: () => "default",
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

import { getArchitectureDecisionRegister } from "@/lib/api/governance-stickiness-api";

const searchParamsState = vi.hoisted(() => ({ current: new URLSearchParams() }));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
    usePathname: () => "/governance/decision-register",
    useSearchParams: () => searchParamsState.current,
    redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: "", runId: "" }),
}));

const mockedGetRegister = vi.mocked(getArchitectureDecisionRegister);

describe("DecisionRegisterClient view switcher", () => {
  beforeEach(() => {
    searchParamsState.current = new URLSearchParams();
    mockedGetRegister.mockReset();
    mockedGetRegister.mockResolvedValue({ decisions: [] });
  });


  it("renders the governance job router chooser at the top (TB-2199 / TB-2230)", async () => {
    render(<DecisionRegisterClient />);

    const strip = await screen.findByTestId("governance-job-router");
    expect(strip).toHaveAttribute("data-current-job", "record-decisions");
    expect(screen.getByTestId("governance-job-router-option-record-decisions")).toHaveAttribute(
      "data-current",
      "true",
    );
    expect(screen.getByTestId("governance-job-router-option-approve-governance")).toHaveAttribute(
      "href",
      "/governance/approval-queue",
    );
    expect(screen.getByTestId("governance-job-router-option-triage-findings")).toHaveAttribute(
      "href",
      "/governance/findings",
    );
  });

  it("switches empty-state chrome between cards and timeline", async () => {
    render(<DecisionRegisterClient />);

    await waitFor(() => {
      expect(screen.getByTestId("decision-register-empty-state")).toBeInTheDocument();
    });

    expect(screen.getByTestId("decision-register-cards")).toBeInTheDocument();
    expect(screen.queryByTestId("decision-register-timeline-panel")).not.toBeInTheDocument();

    const cardsButton = screen.getByRole("button", { name: DECISION_REGISTER_VIEW_CARDS_LABEL });
    const timelineButton = screen.getByRole("button", { name: DECISION_REGISTER_VIEW_TIMELINE_LABEL });

    expect(cardsButton).toHaveAttribute("aria-pressed", "true");
    expect(timelineButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(timelineButton);

    expect(timelineButton).toHaveAttribute("aria-pressed", "true");
    expect(cardsButton).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("decision-register-timeline-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("decision-register-cards")).not.toBeInTheDocument();
    expect(screen.getByTestId("decision-register-empty-state")).toBeInTheDocument();
  });

  it("shows pick review strip before filtering when runId is not scoped", async () => {
    render(<DecisionRegisterClient />);

    await waitFor(() => {
      expect(screen.getByTestId("decision-register-pick-review-before-filtering-strip")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("decision-register-filters")).not.toBeInTheDocument();
  });
});
