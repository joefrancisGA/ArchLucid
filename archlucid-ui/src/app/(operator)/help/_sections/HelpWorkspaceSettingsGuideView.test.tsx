import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpWorkspaceSettingsGuideView } from "@/app/(operator)/help/_sections/HelpWorkspaceSettingsGuideView";
import {
  WORKSPACE_SETTINGS_HELP_ADMIN_PRECONDITION,
  WORKSPACE_SETTINGS_HELP_ADMIN_PRECONDITION_TAG,
  WORKSPACE_SETTINGS_HELP_CLAIM_HEADING_ID,
  WORKSPACE_SETTINGS_HELP_GUIDE_HEADINGS,
  WORKSPACE_SETTINGS_HELP_PAGE_SUBTITLE,
  WORKSPACE_SETTINGS_HELP_PRIMARY_ACTION,
  WORKSPACE_SETTINGS_HELP_START_HERE_CARD_TITLE,
} from "@/lib/workspace-settings-help-guide-content";
import {
  WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE,
  WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING,
  WORKSPACE_SETTINGS_HELP_SOURCES,
} from "@/lib/workspace-settings-help-evidence-copy";
import { TENANT_SETTINGS_PAGE_SUBTITLE } from "@/lib/tenant-settings-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpWorkspaceSettingsGuideView", () => {
  const entry = getProductDocumentationEntry("workspace-settings");

  it("renders provenance, start-here card, readingBody, and deduped follow-ups", () => {
    if (entry === undefined) {
      throw new Error("Expected workspace-settings documentation entry.");
    }

    render(<HelpWorkspaceSettingsGuideView entry={entry} />);

    expect(screen.getByTestId("help-workspace-settings-guide")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Last reviewed 2026-08-13 · administration workspace settings orientation",
    );
    expect(WORKSPACE_SETTINGS_HELP_PAGE_SUBTITLE).not.toBe(TENANT_SETTINGS_PAGE_SUBTITLE);
    expect(screen.getByTestId("help-workspace-settings-admin-precondition")).toHaveTextContent(
      WORKSPACE_SETTINGS_HELP_ADMIN_PRECONDITION,
    );
    expect(screen.getByTestId("help-workspace-settings-admin-precondition-tag")).toHaveTextContent(
      WORKSPACE_SETTINGS_HELP_ADMIN_PRECONDITION_TAG,
    );
    expect(screen.getByTestId("help-workspace-settings-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-workspace-settings-claim-discipline").textContent?.toLowerCase()).not.toContain(
      "sources package",
    );
    expect(screen.getByTestId("help-workspace-settings-claim-discipline").textContent).toContain(
      WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { name: WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      WORKSPACE_SETTINGS_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getByRole("link", { name: WORKSPACE_SETTINGS_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      WORKSPACE_SETTINGS_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: WORKSPACE_SETTINGS_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 2, name: WORKSPACE_SETTINGS_HELP_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(WORKSPACE_SETTINGS_HELP_START_HERE_CARD_TITLE).not.toBe(WORKSPACE_SETTINGS_HELP_PRIMARY_ACTION.label);
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.queryByText(/assurance cites/i)).not.toBeInTheDocument();

    for (const source of WORKSPACE_SETTINGS_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }

    expect(screen.getAllByRole("link", { name: "Projects recycle bin" })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: "Workspace and scope help" })).toHaveLength(1);
    expect(screen.queryByRole("link", { name: "Workspace settings" })).not.toBeInTheDocument();

    for (const heading of WORKSPACE_SETTINGS_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});
