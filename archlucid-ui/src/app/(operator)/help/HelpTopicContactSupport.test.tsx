import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useNavCallerAuthorityRank = vi.hoisted(() => vi.fn(() => 3));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => useNavCallerAuthorityRank(),
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

vi.mock("@/lib/operator/operator-scope-storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/operator/operator-scope-storage")>();

  return {
    ...actual,
    readOperatorScopeFromStorage: () => ({
      workspaceId: "ws-1",
      workspaceLabel: "Pilot workspace",
    }),
  };
});

import { HelpContactSupportGuideView } from "@/app/(operator)/help/_sections/HelpContactSupportGuideView";
import {
  CONTACT_SUPPORT_HELP_OVERVIEW,
  CONTACT_SUPPORT_PRIMARY_ACTIONS,
  CONTACT_SUPPORT_REPORT_PROBLEM_ARTICLE,
} from "@/lib/contact-support-help-guide-content";
import { REPORT_PROBLEM_ACTION_LABEL } from "@/lib/report-problem-copy";
import {
  ARCHLUCID_SUPPORT_EMAIL,
  SUPPORT_REQUEST_CHECKLIST,
  TROUBLESHOOTING_SUPPORT_EXPECTATIONS,
} from "@/lib/support-workspace-present";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpContactSupportGuideView", () => {
  const entry = getProductDocumentationEntry("contact-support");

  it("loads contact-support markdown from the monorepo", () => {
    expect(tryLoadProductDocumentation("contact-support")).not.toBeNull();
  });

  it("surfaces report problem, bundle download, path table, checklist, and provenance", () => {
    if (entry === undefined) {
      throw new Error("Expected contact-support documentation entry.");
    }

    useNavCallerAuthorityRank.mockReturnValue(3);

    render(<HelpContactSupportGuideView entry={entry} />);

    expect(screen.getByTestId("help-contact-support-page-title")).toHaveTextContent("Contact support");
    expect(screen.getByTestId("help-contact-support-overview")).toHaveTextContent(CONTACT_SUPPORT_HELP_OVERVIEW);
    expect(screen.getByTestId("contact-support-help-support-expectations")).toHaveTextContent(
      TROUBLESHOOTING_SUPPORT_EXPECTATIONS,
    );
    expect(screen.getByTestId("contact-support-help-orientation-stack")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: REPORT_PROBLEM_ACTION_LABEL })).toBeInTheDocument();
    expect(screen.getByTestId("support-bundle-download-button")).toBeInTheDocument();
    expect(screen.getByTestId("support-bundle-download-status")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: CONTACT_SUPPORT_PRIMARY_ACTIONS.troubleshooting.label })).toHaveAttribute(
      "href",
      CONTACT_SUPPORT_PRIMARY_ACTIONS.troubleshooting.href,
    );
    expect(screen.getByRole("link", { name: CONTACT_SUPPORT_REPORT_PROBLEM_ARTICLE.label })).toHaveAttribute(
      "href",
      CONTACT_SUPPORT_REPORT_PROBLEM_ARTICLE.href,
    );
    expect(screen.getByTestId("help-contact-support-path-table")).toBeInTheDocument();
    expect(screen.getByTestId("contact-support-help-request-checklist")).toBeInTheDocument();

    for (const item of SUPPORT_REQUEST_CHECKLIST) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }

    expect(screen.getByTestId("contact-support-help-support-email").textContent).toContain(
      ARCHLUCID_SUPPORT_EMAIL,
    );

    const templatedEmail = screen.getByTestId("contact-support-help-email-template");
    expect(templatedEmail).toHaveAttribute("href");
    expect(templatedEmail.getAttribute("href")).toContain(`mailto:${ARCHLUCID_SUPPORT_EMAIL}`);
    expect(templatedEmail.getAttribute("href")).toContain("subject=");
    expect(templatedEmail.getAttribute("href")).toContain("body=");

    expect(screen.getByText(/Last reviewed 2026-08-13/)).toBeInTheDocument();
  });

  it("shows execute requirement when caller rank is below Execute", () => {
    if (entry === undefined) {
      throw new Error("Expected contact-support documentation entry.");
    }

    useNavCallerAuthorityRank.mockReturnValue(1);

    render(<HelpContactSupportGuideView entry={entry} />);

    expect(screen.getByTestId("support-bundle-download-permission")).toHaveTextContent("Execute authority");
    expect(screen.getByTestId("support-bundle-download-button")).toBeDisabled();
  });
});
