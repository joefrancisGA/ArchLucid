import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpDrawerTopicRow } from "@/components/help/HelpDrawerTopicRow";
import type { HelpSearchPanelTopic } from "@/lib/help/help-search-panel-catalog";

describe("HelpDrawerTopicRow (TB-734)", () => {
  it("shows a Documentation browse label for technical help slugs", () => {
    const topic: HelpSearchPanelTopic = {
      id: "admin-diagnostics",
      title: "Admin diagnostics",
      description: "Internal operations diagnostics.",
      keywords: ["diagnostics"],
      action: { kind: "route", href: "/help/admin-diagnostics", helpSlug: "admin-diagnostics" },
      adminOnly: true,
    };

    render(
      <HelpDrawerTopicRow
        topic={topic}
        isHighlighted={false}
        onActivate={vi.fn()}
        onHighlight={vi.fn()}
      />,
    );

    expect(screen.getByTestId("help-drawer-browse-label")).toHaveTextContent("Documentation");
  });

  it("omits the Guide eyebrow for product-help slugs but keeps it in the accessible name", () => {
    const topic: HelpSearchPanelTopic = {
      id: "getting-started-help",
      title: "Getting started",
      description: "Learn how ArchLucid works.",
      keywords: ["start"],
      action: { kind: "route", href: "/help/getting-started", helpSlug: "getting-started" },
    };

    render(
      <HelpDrawerTopicRow
        topic={topic}
        isHighlighted={false}
        onActivate={vi.fn()}
        onHighlight={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("help-drawer-browse-label")).toBeNull();
    expect(screen.getByRole("button")).toHaveAccessibleName(
      "Guide. Getting started. Learn how ArchLucid works.",
    );
  });

  it("renders flat rows without per-row card elevation", () => {
    const topic: HelpSearchPanelTopic = {
      id: "glossary",
      title: "Glossary",
      description: "Definitions used in ArchLucid.",
      keywords: ["glossary"],
      action: { kind: "route", href: "/help/glossary", helpSlug: "glossary" },
    };

    render(
      <HelpDrawerTopicRow
        topic={topic}
        isHighlighted={false}
        onActivate={vi.fn()}
        onHighlight={vi.fn()}
      />,
    );

    expect(screen.getByRole("button").className).not.toContain("shadow-sm");
  });
});
