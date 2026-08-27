import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpApiContractsGuideView } from "@/app/(operator)/help/_sections/HelpApiContractsGuideView";
import { HelpTopicAuthorityGate } from "@/app/(operator)/help/_sections/HelpTopicAuthorityGate";
import {
  API_CONTRACTS_HELP_PAGE_TITLE,
  API_CONTRACTS_HELP_PRIMARY_ACTIONS,
  API_CONTRACTS_HELP_SOURCES,
} from "@/lib/api-contracts-help-guide-content";
import { API_CONTRACTS_HELP_REFERENCE_LANDING } from "@/lib/api-contracts-help-reference-content";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { groupHelpMarkdownHeadings } from "@/lib/help/help-markdown-heading-groups";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { getProductDocumentationEntry, listProductDocumentationEntries, normalizeHelpTopicSlug } from "@/lib/product-documentation-registry";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/api-contracts",
}));

const navAuthMock = vi.hoisted(() => ({
  callerAuthorityRank: 1,
  isAuthorityLoading: false,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: navAuthMock.callerAuthorityRank,
    isAuthorityLoading: navAuthMock.isAuthorityLoading,
    currentPrincipal: { authorityRank: navAuthMock.callerAuthorityRank },
  }),
  useNavCallerAuthorityRank: () =>
    navAuthMock.isAuthorityLoading ? AUTHORITY_RANK.ReadAuthority : navAuthMock.callerAuthorityRank,
}));

/** Distinctive contributor-only contract surface marker from raw API_CONTRACTS.md. */
const API_CONTRACTS_SOURCE_MARKER = "OpenApiContractSnapshotTests";

/** Integrator-safe marker that should remain after presentation strip. */
const API_CONTRACTS_INTEGRATOR_MARKER = "GET /openapi/v1.json";

/** Contributor / CI / runbook leakage must not appear in `/help/api-contracts`. */
const API_CONTRACTS_HELP_BANNED_SUBSTRINGS = [
  "OpenApiContractSnapshotTests",
  "ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT",
  "ARCHLUCID_UPDATE_BUYER_OPENAPI_SNAPSHOT",
  "START_HERE.md",
  "ArchLucid.Api.Tests/Contracts",
  "contracts/bruno",
  "scripts/ci/",
  "docs/runbooks/",
] as const;

const API_CONTRACTS_SOURCE = "docs/library/API_CONTRACTS.md";

describe("HelpApiContractsGuideView (HG)", () => {
  const entry = getProductDocumentationEntry("api-contracts");
  const loaded = tryLoadProductDocumentation("api-contracts");

  it("registers api-contracts as internal-runbook with API-contracts title honesty", () => {
    expect(entry?.slug).toBe("api-contracts");
    expect(entry?.contentKind).toBe("internal-runbook");
    expect(entry?.title).toBe(API_CONTRACTS_HELP_PAGE_TITLE);
    expect(entry?.lastReviewed).toBe("2026-08-10");
    expect(normalizeHelpTopicSlug("api-contracts")).toBe("api-contracts");
  });

  it("does not register governance-api-contracts as a live canonical slug", () => {
    const liveSlugs = listProductDocumentationEntries().map((candidate) => candidate.slug);

    expect(liveSlugs).not.toContain("governance-api-contracts");
  });

  it("loads API_CONTRACTS.md from the monorepo", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.markdown).toContain(API_CONTRACTS_SOURCE_MARKER);
  });

  it("keeps the API contracts heading index aligned with the authoritative markdown source", () => {
    if (loaded === null) {
      throw new Error("Expected api-contracts documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, API_CONTRACTS_SOURCE, {
      helpTopicSlug: "api-contracts",
    });
    const headings = extractHelpMarkdownHeadings(preparedMarkdown);
    const majorSectionIds = headings.filter((heading) => heading.level === 2).map((heading) => heading.id);

    expect(majorSectionIds.length).toBeGreaterThan(0);
    expect(groupHelpMarkdownHeadings(headings).length).toBe(majorSectionIds.length);
  });

  it("blocks non-admin callers from rendering contributor API contract body", () => {
    if (loaded === null || entry === undefined) {
      throw new Error("Expected api-contracts documentation to load.");
    }

    navAuthMock.isAuthorityLoading = false;
    navAuthMock.callerAuthorityRank = AUTHORITY_RANK.ExecuteAuthority;

    render(
      <HelpTopicAuthorityGate entry={entry} denied={<div data-testid="denied">denied</div>}>
        <HelpApiContractsGuideView entry={entry} markdown={loaded.markdown} />
      </HelpTopicAuthorityGate>,
    );

    expect(screen.getByTestId("denied")).toBeInTheDocument();
    expect(screen.queryByTestId("help-api-contracts-guide")).not.toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toContain(API_CONTRACTS_SOURCE_MARKER);
  });

  it("allows admin callers specialty chrome without contributor leakage", () => {
    if (loaded === null || entry === undefined) {
      throw new Error("Expected api-contracts documentation to load.");
    }

    navAuthMock.isAuthorityLoading = false;
    navAuthMock.callerAuthorityRank = AUTHORITY_RANK.AdminAuthority;

    render(
      <HelpTopicAuthorityGate entry={entry} denied={<div data-testid="denied">denied</div>}>
        <HelpApiContractsGuideView entry={entry} markdown={loaded.markdown} />
      </HelpTopicAuthorityGate>,
    );

    expect(screen.queryByTestId("denied")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-api-contracts-guide")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-api-contracts-page-title")).toHaveTextContent(API_CONTRACTS_HELP_PAGE_TITLE);
    expect(screen.getByTestId("help-api-contracts-status-tag")).toHaveTextContent("Admin internal");
    expect(screen.getByTestId("help-api-contracts-version-tag")).toHaveTextContent("v1.0");
    expect(screen.getByTestId("help-api-contracts-header-metadata")).toBeInTheDocument();
    expect(screen.queryByTestId("help-api-contracts-reconciliation")).toBeNull();
    expect(screen.getByTestId("help-api-contracts-reference-landing")).toHaveTextContent(
      API_CONTRACTS_HELP_REFERENCE_LANDING.purpose,
    );
    expect(screen.getByTestId("help-api-contracts-sources")).toBeInTheDocument();
    expect(screen.getByTestId("help-api-contracts-sources-strip")).toBeInTheDocument();
    expect(screen.queryByTestId("help-api-contracts-orientation")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-api-contracts-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-api-contracts-content")).toHaveAttribute("tabindex", "-1");
    expect(screen.getByTestId("help-technical-reference-toc")).toBeInTheDocument();
    expect(screen.getByTestId("help-api-contracts-major-sections")).toBeInTheDocument();
    expect(screen.getByTestId("help-api-contracts-major-sections").innerHTML).not.toMatch(/bg-teal-|border-teal-/);
    expect(screen.getByTestId("help-api-contracts-job-matrix")).toBeInTheDocument();
    expect(screen.getByTestId("help-api-contracts-job-matrix-current")).toHaveTextContent(
      API_CONTRACTS_HELP_PAGE_TITLE,
    );
    expect(screen.getByTestId("help-api-contracts-related-help")).toBeInTheDocument();

    const actionPanel = screen.getByTestId("help-api-contracts-action-panel");

    expect(
      within(actionPanel).getByTestId("help-api-contracts-primary-cta"),
    ).toHaveAttribute("href", API_CONTRACTS_HELP_PRIMARY_ACTIONS.openOpenApi.href);
    expect(within(actionPanel).queryByRole("link", { name: "CLI usage" })).not.toBeInTheDocument();
    expect(within(actionPanel).queryByRole("link", { name: "Governance approval (buyer)" })).not.toBeInTheDocument();

    for (const source of API_CONTRACTS_HELP_SOURCES) {
      expect(
        within(screen.getByTestId("help-api-contracts-sources-strip")).getByRole("link", { name: source.label }),
      ).toHaveAttribute("href", source.href);
    }

    const visibleLinkLabels = screen.getAllByRole("link").map((link) => link.textContent?.trim() ?? "");

    for (const source of API_CONTRACTS_HELP_SOURCES) {
      expect(visibleLinkLabels.filter((label) => label === source.label)).toHaveLength(1);
    }

    const visible = document.body.textContent ?? "";

    expect(visible).toContain(API_CONTRACTS_INTEGRATOR_MARKER);
    expect(visible.toLowerCase()).not.toMatch(/^governance and api contracts/m);

    for (const banned of API_CONTRACTS_HELP_BANNED_SUBSTRINGS) {
      expect(visible, `banned substring still rendered: ${banned}`).not.toContain(banned);
    }

    expect(visible).not.toMatch(/\bTB-\d+\b/i);
  });

  it("exposes the skip target with a focusable reference content column", () => {
    if (loaded === null || entry === undefined) {
      throw new Error("Expected api-contracts documentation to load.");
    }

    render(<HelpApiContractsGuideView entry={entry} markdown={loaded.markdown} />);

    const skipLink = screen.getByRole("link", { name: "Skip to API contracts reference" });
    const contentColumn = screen.getByTestId("help-api-contracts-content");

    expect(skipLink).toHaveAttribute("href", "#help-api-contracts-content");
    expect(contentColumn).toHaveAttribute("tabindex", "-1");
    contentColumn.focus();
    expect(document.activeElement).toBe(contentColumn);
  });
});
