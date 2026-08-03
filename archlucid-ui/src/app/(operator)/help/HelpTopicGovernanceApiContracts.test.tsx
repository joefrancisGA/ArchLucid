import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpApiContractsGuideView } from "@/app/(operator)/help/_sections/HelpApiContractsGuideView";
import { HelpTopicAuthorityGate } from "@/app/(operator)/help/_sections/HelpTopicAuthorityGate";
import {
  GOVERNANCE_API_CONTRACTS_HELP_PAGE_TITLE,
  GOVERNANCE_API_CONTRACTS_HELP_PRIMARY_ACTIONS,
  GOVERNANCE_API_CONTRACTS_HELP_SOURCES,
} from "@/lib/governance-api-contracts-help-guide-content";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { getProductDocumentationEntry, normalizeHelpTopicSlug } from "@/lib/product-documentation-registry";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/governance-api-contracts",
}));

const navAuthMock = vi.hoisted(() => ({
  callerAuthorityRank: 1,
  isAuthorityLoading: false,
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: navAuthMock.callerAuthorityRank,
    isAuthorityLoading: navAuthMock.isAuthorityLoading,
    currentPrincipal: { authorityRank: navAuthMock.callerAuthorityRank },
  }),
  useNavCallerAuthorityRank: () =>
    navAuthMock.isAuthorityLoading ? AUTHORITY_RANK.ReadAuthority : navAuthMock.callerAuthorityRank,
}));

/** Distinctive contributor-only contract surface marker from raw API_CONTRACTS.md. */
const GOVERNANCE_API_CONTRACTS_SOURCE_MARKER = "OpenApiContractSnapshotTests";

/** Integrator-safe marker that should remain after presentation strip (TB-1388). */
const GOVERNANCE_API_CONTRACTS_INTEGRATOR_MARKER = "GET /openapi/v1.json";

/** TB-1388 — contributor / CI / runbook leakage must not appear in `/help/governance-api-contracts`. */
const GOVERNANCE_API_CONTRACTS_HELP_BANNED_SUBSTRINGS = [
  "OpenApiContractSnapshotTests",
  "ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT",
  "ARCHLUCID_UPDATE_BUYER_OPENAPI_SNAPSHOT",
  "START_HERE.md",
  "ArchLucid.Api.Tests/Contracts",
  "contracts/bruno",
  "scripts/ci/",
  "docs/runbooks/",
] as const;

describe("HelpApiContractsGuideView (TB-1384, TB-1386, TB-1388)", () => {
  const entry = getProductDocumentationEntry("governance-api-contracts");
  const loaded = tryLoadProductDocumentation("governance-api-contracts");

  it("registers governance-api-contracts as internal-runbook with API-contracts title honesty", () => {
    expect(entry?.slug).toBe("governance-api-contracts");
    expect(entry?.contentKind).toBe("internal-runbook");
    expect(entry?.title).toBe(GOVERNANCE_API_CONTRACTS_HELP_PAGE_TITLE);
    expect(normalizeHelpTopicSlug("api-contracts")).toBe("governance-api-contracts");
  });

  it("loads API_CONTRACTS.md from the monorepo", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.markdown).toContain(GOVERNANCE_API_CONTRACTS_SOURCE_MARKER);
  });

  it("blocks non-admin callers from rendering contributor API contract body", () => {
    if (loaded === null || entry === undefined) {
      throw new Error("Expected governance-api-contracts documentation to load.");
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
    expect(document.body.textContent ?? "").not.toContain(GOVERNANCE_API_CONTRACTS_SOURCE_MARKER);
  });

  it("allows admin callers specialty chrome without contributor leakage (TB-1386 / TB-1388)", () => {
    if (loaded === null || entry === undefined) {
      throw new Error("Expected governance-api-contracts documentation to load.");
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
    expect(screen.getByTestId("help-api-contracts-page-title")).toHaveTextContent(
      GOVERNANCE_API_CONTRACTS_HELP_PAGE_TITLE,
    );
    expect(screen.getByTestId("help-api-contracts-claim-discipline")).toBeInTheDocument();
    expect(screen.getByTestId("help-api-contracts-orientation")).toBeInTheDocument();

    const actionPanel = screen.getByTestId("help-api-contracts-action-panel");

    expect(
      within(actionPanel).getByRole("link", {
        name: GOVERNANCE_API_CONTRACTS_HELP_PRIMARY_ACTIONS.openCliUsage.label,
      }),
    ).toHaveAttribute("href", GOVERNANCE_API_CONTRACTS_HELP_PRIMARY_ACTIONS.openCliUsage.href);
    expect(
      within(actionPanel).getByRole("link", {
        name: GOVERNANCE_API_CONTRACTS_HELP_PRIMARY_ACTIONS.openBuyerGovernanceApproval.label,
      }),
    ).toHaveAttribute("href", GOVERNANCE_API_CONTRACTS_HELP_PRIMARY_ACTIONS.openBuyerGovernanceApproval.href);

    const sources = screen.getByTestId("help-api-contracts-sources");

    for (const link of GOVERNANCE_API_CONTRACTS_HELP_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    const visible = document.body.textContent ?? "";

    expect(visible).toContain(GOVERNANCE_API_CONTRACTS_INTEGRATOR_MARKER);
    expect(visible.toLowerCase()).not.toMatch(/^governance and api contracts/m);

    for (const banned of GOVERNANCE_API_CONTRACTS_HELP_BANNED_SUBSTRINGS) {
      expect(visible, `banned substring still rendered: ${banned}`).not.toContain(banned);
    }

    expect(visible).not.toMatch(/\bTB-\d+\b/i);
  });
});
