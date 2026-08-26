import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

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
import { DECISION_REGISTER_CLAIM_DISCIPLINE } from "@/lib/decision-register-evidence-copy";

const mockedGetRegister = vi.mocked(getArchitectureDecisionRegister);

describe("DecisionRegisterClient buyer-polished shell", () => {
  beforeEach(() => {
    mockedGetRegister.mockReset();
    mockedGetRegister.mockResolvedValue({ decisions: [] });
  });

  it("renders breadcrumb, buyer subtitle, claim strip, and hides vocabulary rail", async () => {
    render(<DecisionRegisterClient />);

    await waitFor(() => {
      expect(screen.getByTestId("decision-register-empty-state")).toBeInTheDocument();
    });

    expect(screen.getByTestId("decision-register-claim-discipline").textContent).toContain(
      DECISION_REGISTER_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByText(DECISION_REGISTER_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByTestId("decision-register-findings-vocabulary")).not.toBeInTheDocument();
  });
});
