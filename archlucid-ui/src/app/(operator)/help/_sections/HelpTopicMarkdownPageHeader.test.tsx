import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/enterprise-onboarding",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => <div data-testid="help-topic-print-button" />,
}));

import { HelpTopicMarkdownPageHeader } from "@/app/(operator)/help/_sections/HelpTopicMarkdownPageHeader";
import { ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION } from "@/lib/enterprise-onboarding-help-copy";

describe("HelpTopicMarkdownPageHeader", () => {
  const entry = getProductDocumentationEntry("enterprise-onboarding");

  it("renders breadcrumb, registry provenance, identity providers CTA, and export actions", () => {
    if (entry === null) {
      throw new Error("Expected enterprise-onboarding documentation entry.");
    }

    render(
      <HelpTopicMarkdownPageHeader
        entry={entry}
        showContextualHelp
        primaryAction={ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION}
      />,
    );

    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent("Help");
    expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");
    expect(screen.getByTestId("help-topic-page-title")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Last reviewed 2026-08-09");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("V1 GA");
    expect(screen.getByTestId(ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION.testId)).toHaveAttribute(
      "href",
      ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-export-actions")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-print-button")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-pdf-download-button")).toBeNull();
  });
});
