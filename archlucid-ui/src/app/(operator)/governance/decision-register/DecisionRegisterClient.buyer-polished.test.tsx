import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
    isOperatorExperienceFullShellEnv: (): boolean => false,
  };
});

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("@/components/LayerHeader", () => ({
  LayerHeader: () => null,
}));

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  getArchitectureDecisionRegister: vi.fn(),
}));

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  getEffectiveBrowserProxyScopeHeaders: () => ({}),
}));

vi.mock("@/lib/operator/operator-resource-scope", () => ({
  projectIdFromScopeHeaders: () => "default",
}));

import { getArchitectureDecisionRegister } from "@/lib/api/governance-stickiness-api";
import DecisionRegisterClient from "./DecisionRegisterClient";
import {
  DECISION_REGISTER_PAGE_SUBTITLE_BUYER,
} from "./decision-register-copy";
import { DECISION_REGISTER_CLAIM_DISCIPLINE, DECISION_REGISTER_FOLLOW_UPS_TITLE } from "@/lib/decision-register-evidence-copy";
import {
  GOVERNANCE_DECISION_REGISTER_BUYER_START_HERE_HELPER,
  GOVERNANCE_DECISION_REGISTER_PAGE_LEAD,
  GOVERNANCE_DECISION_REGISTER_PRIMARY_CONTENT_ID,
  GOVERNANCE_DECISION_REGISTER_SKIP_LINK_LABEL,
} from "@/lib/governance-decision-register-page-copy";

const mockedGetRegister = vi.mocked(getArchitectureDecisionRegister);

describe("DecisionRegisterClient buyer-polished shell", () => {
  beforeEach(() => {
    mockedGetRegister.mockReset();
    mockedGetRegister.mockResolvedValue({ decisions: [] });
  });

  it("renders skip link, buyer subtitle, first-viewport intro, and orientation after register body", async () => {
    render(<DecisionRegisterClient />);

    await waitFor(() => {
      expect(screen.getByTestId("decision-register-empty-state")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: GOVERNANCE_DECISION_REGISTER_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_DECISION_REGISTER_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("decision-register-claim-discipline").textContent).toContain(
      DECISION_REGISTER_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByText(DECISION_REGISTER_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId("governance-decision-register-first-viewport")).toBeInTheDocument();
    expect(screen.getByTestId("governance-decision-register-intro")).toHaveTextContent(
      GOVERNANCE_DECISION_REGISTER_PAGE_LEAD,
    );
    expect(screen.getByTestId("governance-decision-register-buyer-start-here-helper")).toHaveTextContent(
      GOVERNANCE_DECISION_REGISTER_BUYER_START_HERE_HELPER,
    );
    expect(screen.getByRole("heading", { level: 2, name: DECISION_REGISTER_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByTestId("decision-register-findings-vocabulary")).not.toBeInTheDocument();

    const primary = screen.getByTestId("governance-decision-register-primary-content");
    const orientation = screen.getByTestId("decision-register-orientation-bottom");
    const emptyState = screen.getByTestId("decision-register-empty-state");

    expect(primary).toContainElement(orientation);
    expect(emptyState.compareDocumentPosition(orientation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
