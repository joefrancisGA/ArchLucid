import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpDrawerTopicRow } from "@/components/help/HelpDrawerTopicRow";
import type { HelpSearchPanelTopic } from "@/lib/help-search-panel-catalog";

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

  it("shows a Guide browse label for product-help slugs", () => {
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

    expect(screen.getByTestId("help-drawer-browse-label")).toHaveTextContent("Guide");
  });
});
