import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpWorkspaceSettingsGuideView } from "@/app/(operator)/help/_sections/HelpWorkspaceSettingsGuideView";
import {
  WORKSPACE_SETTINGS_HELP_ADMIN_PRECONDITION,
  WORKSPACE_SETTINGS_HELP_ADMIN_PRECONDITION_ID,
  WORKSPACE_SETTINGS_HELP_BREADCRUMB_TOPIC_TITLE,
  WORKSPACE_SETTINGS_HELP_CLAIM_HEADING_ID,
  WORKSPACE_SETTINGS_HELP_GUIDE_HEADINGS,
  WORKSPACE_SETTINGS_HELP_PAGE_SUBTITLE,
  WORKSPACE_SETTINGS_HELP_PAGE_TITLE,
  WORKSPACE_SETTINGS_HELP_PRIMARY_ACTION,
  WORKSPACE_SETTINGS_HELP_START_HERE_CARD_TITLE,
  WORKSPACE_SETTINGS_HELP_TILE_ITEMS,
} from "@/lib/workspace-settings-help-guide-content";
import {
  WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE,
  WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING,
  WORKSPACE_SETTINGS_HELP_SOURCES,
} from "@/lib/workspace-settings-help-evidence-copy";
import { TENANT_SETTINGS_PAGE_SUBTITLE } from "@/lib/tenant-settings-page-copy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpWorkspaceSettingsGuideView", () => {
  const entry = getProductDocumentationEntry("workspace-settings");

  it("renders provenance, breadcrumb, start-here card, readingBody, and deduped follow-ups", () => {
    if (entry === undefined) {
      throw new Error("Expected workspace-settings documentation entry.");
    }

    render(<HelpWorkspaceSettingsGuideView entry={entry} />);

    expect(screen.getByTestId("help-workspace-settings-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent("Help & Support");
    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent(
      WORKSPACE_SETTINGS_HELP_BREADCRUMB_TOPIC_TITLE,
    );
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-08-13");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Administration · Workspace settings orientation",
    );
    expect(screen.getByTestId("help-topic-registry-provenance")).not.toHaveTextContent(
      "administration workspace settings orientation",
    );
    expect(WORKSPACE_SETTINGS_HELP_PAGE_SUBTITLE).not.toBe(TENANT_SETTINGS_PAGE_SUBTITLE);
    expect(WORKSPACE_SETTINGS_HELP_TILE_ITEMS[0]?.label).not.toBe(WORKSPACE_SETTINGS_HELP_PAGE_TITLE);
    expect(screen.getByTestId("help-workspace-settings-admin-precondition")).toHaveTextContent(
      WORKSPACE_SETTINGS_HELP_ADMIN_PRECONDITION,
    );
    expect(screen.queryByTestId("help-workspace-settings-admin-precondition-tag")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: WORKSPACE_SETTINGS_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "aria-describedby",
      WORKSPACE_SETTINGS_HELP_ADMIN_PRECONDITION_ID,
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
    expect(screen.queryByText(/assurance cites/i)).not.toBeInTheDocument();

    for (const source of WORKSPACE_SETTINGS_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);

      expect(screen.getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(screen.getAllByRole("link", { name: "Open Projects recycle bin" })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: "Read Workspace and scope help" })).toHaveLength(1);
    expect(screen.queryByRole("link", { name: "Workspace settings" })).not.toBeInTheDocument();

    for (const heading of WORKSPACE_SETTINGS_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});
