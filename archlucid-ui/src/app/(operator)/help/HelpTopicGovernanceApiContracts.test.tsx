import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { HelpTopicAuthorityGate } from "@/app/(operator)/help/_sections/HelpTopicAuthorityGate";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
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

describe("HelpTopicGovernanceApiContracts (TB-1384, TB-1388)", () => {
  const entry = getProductDocumentationEntry("governance-api-contracts");
  const loaded = tryLoadProductDocumentation("governance-api-contracts");

  it("registers governance-api-contracts as internal-runbook", () => {
    expect(entry?.slug).toBe("governance-api-contracts");
    expect(entry?.contentKind).toBe("internal-runbook");
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
        <HelpTopicMarkdownView entry={entry} markdown={loaded.markdown} />
      </HelpTopicAuthorityGate>,
    );

    expect(screen.getByTestId("denied")).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toContain(GOVERNANCE_API_CONTRACTS_SOURCE_MARKER);
  });

  it("allows admin callers to render integrator-safe API contract body without contributor leakage (TB-1388)", () => {
    if (loaded === null || entry === undefined) {
      throw new Error("Expected governance-api-contracts documentation to load.");
    }

    navAuthMock.isAuthorityLoading = false;
    navAuthMock.callerAuthorityRank = AUTHORITY_RANK.AdminAuthority;

    render(
      <HelpTopicAuthorityGate entry={entry} denied={<div data-testid="denied">denied</div>}>
        <HelpTopicMarkdownView entry={entry} markdown={loaded.markdown} />
      </HelpTopicAuthorityGate>,
    );

    expect(screen.queryByTestId("denied")).not.toBeInTheDocument();
    expect(screen.getByRole("article")).toBeInTheDocument();

    const visible = document.body.textContent ?? "";

    expect(visible).toContain(GOVERNANCE_API_CONTRACTS_INTEGRATOR_MARKER);

    for (const banned of GOVERNANCE_API_CONTRACTS_HELP_BANNED_SUBSTRINGS) {
      expect(visible, `banned substring still rendered: ${banned}`).not.toContain(banned);
    }

    expect(visible).not.toMatch(/\bTB-\d+\b/i);
  });
});
