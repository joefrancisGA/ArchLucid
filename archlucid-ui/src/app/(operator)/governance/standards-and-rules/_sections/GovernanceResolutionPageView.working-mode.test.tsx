import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  GOVERNANCE_STANDARDS_RULES_PRIMARY_CONTENT_ID,
  GOVERNANCE_STANDARDS_RULES_SKIP_LINK_LABEL,
} from "@/lib/governance-standards-rules-page-copy";
import { STANDARDS_RULES_CLAIM_DISCIPLINE } from "@/lib/standards-rules-evidence-copy";

import { GovernanceResolutionPageView } from "./GovernanceResolutionPageView";
import type { GovernanceResolutionPageViewModel } from "./governance-resolution-page-view-model";

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: () => <div data-testid="ask-run-id-picker" />,
}));

vi.mock("@/components/LayerHeader", () => ({
  LayerHeader: () => null,
}));

function buildModel(overrides: Partial<GovernanceResolutionPageViewModel> = {}): GovernanceResolutionPageViewModel {
  return {
    buyerPolishedShell: false,
    canMutateEnterprisePolicySurfaces: false,
    data: null,
    loading: false,
    failure: null,
    blockedReason: null,
    lastRefreshedAt: new Date("2026-09-22T12:00:00.000Z"),
    load: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe("GovernanceResolutionPageView working mode", () => {
  it("renders skip link, context strip, scope status, and keyboard affordance", () => {
    render(<GovernanceResolutionPageView model={buildModel()} />);

    expect(screen.getByRole("link", { name: GOVERNANCE_STANDARDS_RULES_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_STANDARDS_RULES_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("standards-rules-claim-discipline")).toHaveTextContent(
      STANDARDS_RULES_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("standards-rules-context-strip")).toBeInTheDocument();
    expect(screen.getByTestId("standards-rules-scope-status")).toHaveTextContent("Not scoped");
    expect(screen.getByTestId("standards-rules-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("standards-rules-keyboard-affordance")).toHaveTextContent(/page help/i);
    expect(screen.getByText(/Policy pack conflicts/)).toBeInTheDocument();
  });

  it("renders error recovery contract on load failure", () => {
    render(
      <GovernanceResolutionPageView
        model={buildModel({
          failure: {
            message: "Could not load standards and rules.",
            correlationId: "corr-standards",
            problem: null,
          },
        })}
      />,
    );

    expect(screen.getByTestId("standards-rules-load-failure")).toBeInTheDocument();
    expect(screen.getAllByTestId("operator-error-recovery-contract").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Policy pack conflicts/)).not.toBeInTheDocument();
  });
});
