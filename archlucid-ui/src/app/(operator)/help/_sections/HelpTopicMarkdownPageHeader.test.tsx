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
  HelpTopicPrintButton: (props: { allowWithoutServerPdf?: boolean }) => (
    <div data-testid="help-topic-print-button" data-allow-without-server-pdf={props.allowWithoutServerPdf === true} />
  ),
}));

import { HelpTopicMarkdownPageHeader } from "@/app/(operator)/help/_sections/HelpTopicMarkdownPageHeader";
import { ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION } from "@/lib/enterprise-onboarding-help-copy";

describe("HelpTopicMarkdownPageHeader", () => {
  const entry = getProductDocumentationEntry("enterprise-onboarding");

  it("renders identity providers CTA, export actions, and breadcrumb", () => {
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

    expect(screen.getByTestId("help-topic-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-page-title")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-header-metadata")).toBeInTheDocument();
    expect(screen.getByTestId(ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION.testId)).toHaveAttribute(
      "href",
      ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-export-actions")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-print-button")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-pdf-download-button")).toBeNull();
  });

  it("does not render an empty export action container when only contextual help is requested", () => {
    const procurement = getProductDocumentationEntry("procurement");

    if (procurement === null) {
      throw new Error("Expected procurement documentation entry.");
    }

    render(
      <HelpTopicMarkdownPageHeader
        entry={procurement}
        allowWithoutServerPdf
      />,
    );

    expect(screen.getByTestId("help-topic-export-actions")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-print-button")).toHaveAttribute("data-allow-without-server-pdf", "true");
    expect(screen.queryByTestId("page-contextual-help-button")).toBeNull();
  });
});
