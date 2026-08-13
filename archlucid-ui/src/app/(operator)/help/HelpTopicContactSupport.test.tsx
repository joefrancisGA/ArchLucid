import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: ({ source }: { readonly source: string }) => (
    <div data-testid="mermaid-diagram">{source}</div>
  ),
}));

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/lib/use-support-bundle-download", () => ({
  useSupportBundleDownload: () => ({
    downloading: false,
    bundleStatus: "idle",
    error: null,
    lastGeneratedAt: null,
    onDownload: vi.fn(),
  }),
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { ContactSupportHelpOrientationStack } from "@/components/help/ContactSupportHelpOrientationStack";
import { CONTACT_SUPPORT_PRIMARY_ACTIONS } from "@/lib/contact-support-help-guide-content";
import { ARCHLUCID_SUPPORT_EMAIL } from "@/lib/support-workspace-present";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpTopicMarkdownView contact support", () => {
  const loaded = tryLoadProductDocumentation("contact-support");

  it("loads contact-support markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("surfaces support paths, email, and bundle download", () => {
    if (loaded === null) {
      throw new Error("Expected contact-support documentation to load.");
    }

    render(
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        evidenceOrientation={<ContactSupportHelpOrientationStack />}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Contact support" })).toBeInTheDocument();
    expect(screen.getByTestId("contact-support-help-orientation-stack")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: CONTACT_SUPPORT_PRIMARY_ACTIONS.reportProblem.label })).toHaveAttribute(
      "href",
      CONTACT_SUPPORT_PRIMARY_ACTIONS.reportProblem.href,
    );
    expect(screen.getByRole("link", { name: CONTACT_SUPPORT_PRIMARY_ACTIONS.emailSupport.label })).toHaveAttribute(
      "href",
      `mailto:${ARCHLUCID_SUPPORT_EMAIL}`,
    );
    expect(screen.getByTestId("contact-support-help-support-email").textContent).toContain(
      ARCHLUCID_SUPPORT_EMAIL,
    );
    expect(screen.getByTestId("support-bundle-download-button")).toBeInTheDocument();
  });
});
