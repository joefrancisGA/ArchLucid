import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpWorkspaceSettingsGuideView } from "@/app/(operator)/help/_sections/HelpWorkspaceSettingsGuideView";
import {
  WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE,
  WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/workspace-settings-help-evidence-copy";
import {
  WORKSPACE_SETTINGS_HELP_CLAIM_HEADING_ID,
  WORKSPACE_SETTINGS_HELP_GUIDE_HEADINGS,
} from "@/lib/workspace-settings-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpWorkspaceSettingsGuideView", () => {
  const entry = getProductDocumentationEntry("workspace-settings");

  it("renders claim discipline heading id and guide headings in the TOC", () => {
    if (entry === undefined) {
      throw new Error("Expected workspace-settings documentation entry.");
    }

    render(<HelpWorkspaceSettingsGuideView entry={entry} />);

    expect(screen.getByTestId("help-workspace-settings-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-workspace-settings-claim-discipline").textContent).toContain(
      WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { name: WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      WORKSPACE_SETTINGS_HELP_CLAIM_HEADING_ID,
    );

    for (const heading of WORKSPACE_SETTINGS_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});
