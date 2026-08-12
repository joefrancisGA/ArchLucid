import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => <div data-testid="help-topic-print-button" />,
}));

vi.mock("@/hooks/use-operator-scope-query-key", () => ({
  useOperatorScopeQueryKey: () => ({
    tenantId: "11111111-1111-1111-1111-111111111111",
    workspaceId: "22222222-2222-2222-2222-222222222222",
    projectId: "33333333-3333-3333-3333-333333333333",
  }),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

vi.mock("@/lib/operator/operator-scope-storage", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/operator/operator-scope-storage")>();

  return {
    ...mod,
    readOperatorScopeFromStorage: vi.fn(() => null),
  };
});

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { ScopeHelpCurrentScopePanel } from "@/components/help/ScopeHelpCurrentScopePanel";
import { ScopeHelpEvidenceOrientationStrip } from "@/components/help/ScopeHelpEvidenceOrientationStrip";
import {
  BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL,
} from "@/lib/buyer/buyer-polish-copy";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { SCOPE_HELP_CLAIM_DISCIPLINE, SCOPE_HELP_PRIMARY_ACTION } from "@/lib/scope-help-evidence-copy";

describe("HelpTopicMarkdownView workspace and scope guide", () => {
  const loaded = tryLoadProductDocumentation("scope");

  it("loads the workspace and scope guide markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("renders the page title as Workspace and scope guide", () => {
    if (loaded === null) {
      throw new Error("Expected scope documentation to load.");
    }

    render(
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        evidenceOrientation={
          <>
            <ScopeHelpEvidenceOrientationStrip />
            <ScopeHelpCurrentScopePanel />
          </>
        }
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Workspace and scope guide" })).toBeInTheDocument();
  });

  it("renders breadcrumb, primary action, and print action in the header", () => {
    if (loaded === null) {
      throw new Error("Expected scope documentation to load.");
    }

    render(
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        showContextualHelp
        evidenceOrientation={
          <>
            <ScopeHelpEvidenceOrientationStrip />
            <ScopeHelpCurrentScopePanel />
          </>
        }
      />,
    );

    const breadcrumb = screen.getByTestId("help-topic-breadcrumb");
    expect(within(breadcrumb).getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");
    expect(breadcrumb).toHaveTextContent("Workspace and scope guide");
    expect(screen.getByTestId(SCOPE_HELP_PRIMARY_ACTION.testId)).toHaveAttribute(
      "href",
      SCOPE_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getByTestId("help-topic-print-button")).toBeInTheDocument();
  });

  it("renders claim discipline and live scope readout above the guide body", () => {
    if (loaded === null) {
      throw new Error("Expected scope documentation to load.");
    }

    render(
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        evidenceOrientation={
          <>
            <ScopeHelpEvidenceOrientationStrip />
            <ScopeHelpCurrentScopePanel />
          </>
        }
      />,
    );

    expect(screen.getByTestId("scope-help-claim-discipline")).toHaveTextContent(SCOPE_HELP_CLAIM_DISCIPLINE);
    expect(screen.getByTestId("scope-help-current-scope-panel")).toBeInTheDocument();
    expect(screen.getByTestId("scope-help-current-scope-status")).toHaveTextContent("Sample");
  });

  it("renders the Three scope levels table with tenant, workspace, and project rows", () => {
    if (loaded === null) {
      throw new Error("Expected scope documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("heading", { name: "Three scope levels" })).toBeInTheDocument();
    expect(screen.getByText("Tenant")).toBeInTheDocument();
    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByText("Project")).toBeInTheDocument();
  });

  it("describes sample badge placement and connected switcher labels from scope-switcher constants", () => {
    if (loaded === null) {
      throw new Error("Expected scope documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const contentColumn = screen.getByTestId("help-topic-content");
    const renderedText = contentColumn.textContent ?? "";

    expect(renderedText).toContain(BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL);
    expect(renderedText).toContain("Workspace: {name} — {project}");
    expect(renderedText).toMatch(/Sample badge appears inside the panel/i);
    expect(renderedText).not.toMatch(/header may show .*Sample badge/i);
  });

  it("renders the Sample workspace section explaining demo data is not tenant data", () => {
    if (loaded === null) {
      throw new Error("Expected scope documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("heading", { name: "Sample workspace" })).toBeInTheDocument();
    expect(screen.getByText(/demonstration only/i)).toBeInTheDocument();
    expect(screen.getByText(/not your real tenant data/i)).toBeInTheDocument();
    expect(screen.getByText(/workspace switching is disabled in demo mode/i)).toBeInTheDocument();
    expect(screen.getByText(/sign in to a connected environment/i)).toBeInTheDocument();
  });

  it("renders the When content looks wrong table with concise symptom rows", () => {
    if (loaded === null) {
      throw new Error("Expected scope documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("heading", { name: "When content looks wrong" })).toBeInTheDocument();
    expect(screen.getByText("Empty reviews list")).toBeInTheDocument();
    expect(screen.getByText(/architecture review not found/i)).toBeInTheDocument();
    expect(screen.getByText("Sample badge unexpected")).toBeInTheDocument();
  });

  it("styles the Troubleshooting recovery reference as a real link", () => {
    if (loaded === null) {
      throw new Error("Expected scope documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const troubleshootingLinks = screen.getAllByRole("link", { name: "Troubleshooting" });

    expect(troubleshootingLinks.length).toBeGreaterThan(0);

    for (const link of troubleshootingLinks) {
      expect(link).toHaveAttribute("href", "/help/troubleshooting");
    }
  });

  it("links Settings to Tenant from the who manages scope section", () => {
    if (loaded === null) {
      throw new Error("Expected scope documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const contentColumn = screen.getByTestId("help-topic-content");
    expect(within(contentColumn).getByRole("link", { name: "Settings → Tenant" })).toHaveAttribute(
      "href",
      "/administration/tenant",
    );
  });

  it("renders Related help entries as accessible links with proper hrefs", () => {
    if (loaded === null) {
      throw new Error("Expected scope documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const relatedHelpHeading = screen.getByRole("heading", { name: "Related help" });
    const contentColumn = screen.getByTestId("help-topic-content");

    expect(within(contentColumn).getByRole("link", { name: "Getting started" })).toHaveAttribute(
      "href",
      "/help/getting-started",
    );
    expect(within(contentColumn).getByRole("link", { name: "Users and roles" })).toHaveAttribute(
      "href",
      "/help/users-and-roles",
    );
    expect(within(contentColumn).getByRole("link", { name: "Data handling & isolation" })).toHaveAttribute(
      "href",
      "/help/data-handling",
    );
    expect(relatedHelpHeading).toBeInTheDocument();
  });

  it("does not use internal operator/runbook terminology in the rendered page", () => {
    if (loaded === null) {
      throw new Error("Expected scope documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const contentColumn = screen.getByTestId("help-topic-content");
    const renderedText = contentColumn.textContent ?? "";

    expect(renderedText).not.toMatch(/\boperator\b/i);
    expect(renderedText).not.toMatch(/\brunbook\b/i);
    expect(renderedText).not.toMatch(/operator shell/i);
  });
});
