import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

const mockSearchParams = vi.hoisted(() => new URLSearchParams());

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/first-login-workspace",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

import { HelpFirstLoginWorkspaceGuideView } from "@/app/(operator)/help/_sections/HelpFirstLoginWorkspaceGuideView";
import {
  FIRST_LOGIN_WORKSPACE_HELP_CLAIM_DISCIPLINE,
  FIRST_LOGIN_WORKSPACE_HELP_GUIDE_HEADINGS,
  FIRST_LOGIN_WORKSPACE_HELP_HELP_RETURN,
  FIRST_LOGIN_WORKSPACE_HELP_PAGE_SUBTITLE,
  FIRST_LOGIN_WORKSPACE_HELP_TITLE,
} from "@/lib/first-login-workspace-help-guide-content";
import {
  FIRST_LOGIN_WORKSPACE_HELP_SKIP_LINK_LABEL,
  FIRST_LOGIN_WORKSPACE_HELP_SKIP_TARGET_ID,
} from "@/lib/first-login-workspace-help-page-copy";
import { FIRST_LOGIN_WORKSPACE_HELP_RETURN_TO_WORKSPACE_LABEL } from "@/lib/first-login-workspace-help-return";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpFirstLoginWorkspaceGuideView (LS-015 / HFI Phase 2)", () => {
  const entry = getProductDocumentationEntry("first-login-workspace");

  it("renders breadcrumb, provenance, claim discipline, sections, and related links", () => {
    if (entry === undefined) {
      throw new Error("Expected first-login-workspace documentation entry.");
    }

    render(<HelpFirstLoginWorkspaceGuideView entry={entry} />);

    expect(screen.getByTestId("help-first-login-workspace-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("help-first-login-workspace-page-title")).toHaveTextContent(
      FIRST_LOGIN_WORKSPACE_HELP_TITLE,
    );
    expect(screen.getByText(FIRST_LOGIN_WORKSPACE_HELP_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toBeInTheDocument();
    expect(screen.getByTestId("help-first-login-workspace-header-claim-discipline")).toHaveTextContent(
      FIRST_LOGIN_WORKSPACE_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.getByRole("link", { name: FIRST_LOGIN_WORKSPACE_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${FIRST_LOGIN_WORKSPACE_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-first-login-workspace-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.queryByTestId("help-first-login-workspace-honesty-panel")).not.toBeInTheDocument();

    for (const heading of FIRST_LOGIN_WORKSPACE_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: heading.level, name: heading.title })).toHaveAttribute(
        "id",
        heading.id,
      );
    }

    expect(screen.getByTestId("help-first-login-workspace-blocked-reason")).toHaveTextContent(/inline reason/i);
    expect(screen.getByTestId("help-first-login-workspace-error-recovery")).toHaveTextContent("What failed");
    expect(screen.getByTestId("help-first-login-workspace-applicability-architecture")).toHaveTextContent(/Working Architecture/i);

    expect(screen.getByTestId("help-first-login-workspace-return-to-help")).toHaveAttribute(
      "href",
      FIRST_LOGIN_WORKSPACE_HELP_HELP_RETURN.href,
    );
  });

  it("renders returnTo workspace link when valid", () => {
    if (entry === undefined) {
      throw new Error("Expected first-login-workspace documentation entry.");
    }

    mockSearchParams.set("returnTo", "/settings/workspace");
    render(<HelpFirstLoginWorkspaceGuideView entry={entry} />);

    expect(screen.getByTestId("help-first-login-workspace-return-to-workspace")).toHaveAttribute(
      "href",
      "/settings/workspace",
    );
    expect(screen.getByTestId("help-first-login-workspace-return-to-workspace")).toHaveTextContent(
      FIRST_LOGIN_WORKSPACE_HELP_RETURN_TO_WORKSPACE_LABEL,
    );

    mockSearchParams.delete("returnTo");
  });
});
