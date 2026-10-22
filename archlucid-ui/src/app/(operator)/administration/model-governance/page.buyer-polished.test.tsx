import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

vi.mock("@/components/ModelGovernanceAiUsageVocabularyRail", () => ({
  ModelGovernanceAiUsageVocabularyRail: () => <div data-testid="model-governance-ai-usage-vocabulary-rail" />,
}));

vi.mock("./_sections/ModelGovernanceSettingsCard", () => ({
  ModelGovernanceSettingsCard: () => <div data-testid="model-governance-settings-card-stub" />,
}));

import {
  AI_MODELS_SETTINGS_PAGE_SUBTITLE,
  MODEL_GOVERNANCE_SETTINGS_CLAIM_DISCIPLINE,
  MODEL_GOVERNANCE_SETTINGS_FOLLOW_UPS_TITLE,
  MODEL_GOVERNANCE_SETTINGS_SOURCES,
} from "@/lib/model-governance-settings-evidence-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

import ModelGovernanceSettingsPage from "./page";
import {
  AI_MODELS_SETTINGS_PAGE_SUBTITLE_BUYER,
  MODEL_GOVERNANCE_SETTINGS_FIRST_VIEWPORT_ID,
  MODEL_GOVERNANCE_SETTINGS_SKIP_LINK_LABEL,
  MODEL_GOVERNANCE_SETTINGS_SKIP_TARGET_ID,
} from "./_sections/model-governance-settings-page-copy";

describe("ModelGovernanceSettingsPage buyer-polished shell (AMO)", () => {
  it("renders skip link, orientation-top above workspace in first viewport, buyer subtitle, and hides contextual help", () => {
    render(<ModelGovernanceSettingsPage />);

    expect(screen.getByRole("link", { name: MODEL_GOVERNANCE_SETTINGS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${MODEL_GOVERNANCE_SETTINGS_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(AI_MODELS_SETTINGS_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(AI_MODELS_SETTINGS_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("model-governance-settings-claim-discipline")).toHaveTextContent(
      MODEL_GOVERNANCE_SETTINGS_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("model-governance-ai-usage-vocabulary-rail")).not.toBeInTheDocument();
    expect(screen.queryByTestId("model-governance-settings-orientation-bottom")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: MODEL_GOVERNANCE_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const primaryContent = screen.getByTestId("model-governance-settings-primary-content");
    const firstViewport = screen.getByTestId(MODEL_GOVERNANCE_SETTINGS_FIRST_VIEWPORT_ID);
    const orientationTop = screen.getByTestId("model-governance-settings-orientation-top");
    const settingsCard = screen.getByTestId("model-governance-settings-card-stub");
    const sourcesSection = screen.getByTestId("model-governance-settings-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(settingsCard);
    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(settingsCard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const source of filterWhereToGoNextFollowUpLinks(MODEL_GOVERNANCE_SETTINGS_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
