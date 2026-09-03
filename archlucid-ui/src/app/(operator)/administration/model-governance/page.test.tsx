import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("./_sections/ModelGovernanceSettingsCard", () => ({
  ModelGovernanceSettingsCard: () => <div data-testid="model-governance-settings-card-stub" />,
}));

import {
  AI_MODELS_SETTINGS_PAGE_SUBTITLE,
  MODEL_GOVERNANCE_SETTINGS_CLAIM_DISCIPLINE,
} from "@/lib/model-governance-settings-evidence-copy";

import ModelGovernanceSettingsPage from "./page";

describe("ModelGovernanceSettingsPage", () => {
  it("renders one page title without Settings back link or duplicate governance heading (TB-1928 / TB-2094)", () => {
    render(<ModelGovernanceSettingsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "AI models" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "AI models" })).toHaveLength(1);
    expect(screen.queryByRole("link", { name: "← Settings" })).not.toBeInTheDocument();
    expect(screen.getByTestId("model-governance-settings-card-stub")).toBeInTheDocument();
    expect(screen.getByText(AI_MODELS_SETTINGS_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("model-governance-settings-claim-discipline")).toHaveTextContent(
      MODEL_GOVERNANCE_SETTINGS_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("model-governance-settings-orientation-bottom")).toBeInTheDocument();
  });
});
