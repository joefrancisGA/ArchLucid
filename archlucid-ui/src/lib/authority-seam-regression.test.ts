/**
 * Cross-module authority seams: `/me` read-model, nav policy filtering, tier+authority composition, and Enterprise
 * mutation capability must stay aligned (same rank numerics and policy names as `nav-authority.ts`). These are narrow
 * regression guards — not a second authZ engine; the API remains authoritative.
 *
 * @see `OperatorNavAuthorityProvider.test.tsx` — conservative `useNavCallerAuthorityRank` while JWT `/me` refetches.
 * @see `LayerHeader.test.tsx` — Enterprise rank cue + packaging strip; `enterprise-authority-ui-shaping.test.tsx` — mutation hook → controls.
 */
import { describe, expect, it } from "vitest";

import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor-dashboard-route";
import {
  normalizeAuthMeResponse,
  operatorNavOutsideProviderPrincipal,
  shellBootstrapReadPrincipal,
} from "@/lib/current-principal";
import { operateCapabilityFromRank } from "@/lib/operate-capability";
import { LAYER_PAGE_GUIDANCE, type LayerGuidanceBlock } from "@/lib/layer-guidance";
import { NAV_GROUPS } from "@/lib/nav-config";
import {
  AUTHORITY_RANK,
  filterNavLinksByAuthority,
  maxAuthorityRankFromMeClaims,
  navLinkVisibleForCallerRank,
} from "@/lib/nav-authority";
import { filterNavLinksForOperatorShell, listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";

describe("authority seam regression", () => {
  const enterpriseLinks = NAV_GROUPS.find((g) => g.id === "operate-governance")?.links;

  it("defines Operate governance links so Reader authority filter exposes both the alerts inbox and the approval queue (browsing only — mutations stay Execute-gated in the page itself)", () => {
    expect(enterpriseLinks).toBeDefined();

    const readerVisible = filterNavLinksByAuthority(enterpriseLinks!, AUTHORITY_RANK.ReadAuthority);
    const hrefsRead = new Set(readerVisible.map((l) => l.href));

    // Approval queue (/governance) browsing (dashboard/list/lineage/rationale) only needs ReadAuthority, matching
    // GovernanceController's class-level [Authorize(ReadAuthority)] default; approve/reject/promote/activate stay
    // Execute-gated via canMutateWorkflow inside GovernanceWorkflowPageContent, not the nav link itself.
    expect(hrefsRead.has("/governance/alerts")).toBe(true);
    expect(hrefsRead.has("/governance/approval-queue")).toBe(true);
  });

  /**
   * Drift guard: every `ExecuteAuthority` row in `nav-config` must stay invisible to Read callers and visible at Execute+.
   * Uses hrefs from config (not copy) so new links inherit the same contract automatically.
   * **`operate-analysis`** and **`operate-governance`** are Read-only nav-gate groups after authority-seam review (deeper
   * mutations stay Execute-gated inside the pages themselves); Execute-class rhythm links live under
   * **`operate-integrations`** and **`operator-system-admin`**.
   */
  it("hides every ExecuteAuthority-marked Operate nav link from Read callers", () => {
    const groupIds = ["operate-integrations", "operator-system-admin"] as const;

    for (const groupId of groupIds) {
      const links = NAV_GROUPS.find((g) => g.id === groupId)?.links;

      expect(links, groupId).toBeDefined();

      const executeLinks = links!.filter((l) => l.requiredAuthority === "ExecuteAuthority");

      expect(executeLinks.length, `${groupId} should declare at least one Execute-tier destination`).toBeGreaterThan(0);

      const readerHrefs = new Set(
        filterNavLinksByAuthority(links!, AUTHORITY_RANK.ReadAuthority).map((l) => l.href),
      );

      for (const link of executeLinks) {
        expect(readerHrefs.has(link.href), link.href).toBe(false);
        expect(navLinkVisibleForCallerRank(link, AUTHORITY_RANK.ExecuteAuthority), link.href).toBe(true);
      }
    }
  });

  /**
   * Insights is Read-only at the nav gate. The sponsor report absorbed the pilot outcomes page, which Read callers
   * could always open, so gating the nav row at Execute would take away a report Readers already had; the DOCX and
   * board-pack exports stay Execute-gated inside the page via `useOperateCapability`.
   */
  it("keeps Insights nav rows Read-gated so reporting stays open and exports gate in-page", () => {
    const analysis = NAV_GROUPS.find((g) => g.id === "operate-analysis");

    expect(analysis).toBeDefined();
    expect(analysis!.links.filter((l) => l.requiredAuthority === "ExecuteAuthority")).toEqual([]);

    const readerHrefs = new Set(
      filterNavLinksByAuthority(analysis!.links, AUTHORITY_RANK.ReadAuthority).map((l) => l.href),
    );

    expect(readerHrefs.has("/insights/sponsor-report")).toBe(true);
  });

  it("keeps maxAuthorityRankFromMeClaims aligned with normalizeAuthMeResponse.authorityRank for representative /me claims", () => {
    const cases: { claims: { type: string; value: string }[]; label: string }[] = [
      { label: "Reader", claims: [{ type: "roles", value: "Reader" }] },
      { label: "Operator", claims: [{ type: "roles", value: "Operator" }] },
      { label: "Admin", claims: [{ type: "roles", value: "Admin" }] },
      { label: "Auditor", claims: [{ type: "roles", value: "Auditor" }] },
      { label: "empty", claims: [] },
    ];

    for (const { claims, label } of cases) {
      const fromClaims = maxAuthorityRankFromMeClaims(claims);
      const fromPrincipal = normalizeAuthMeResponse({ claims }).authorityRank;

      expect(fromPrincipal, label).toBe(fromClaims);
    }
  });

  it("ties operateCapabilityFromRank to normalized principal rank (same threshold as nav Execute tier)", () => {
    const table: { claims: { type: string; value: string }[]; expectMutate: boolean }[] = [
      { claims: [{ type: "roles", value: "Reader" }], expectMutate: false },
      { claims: [{ type: "roles", value: "Auditor" }], expectMutate: false },
      { claims: [{ type: "roles", value: "Operator" }], expectMutate: true },
      { claims: [{ type: "roles", value: "Admin" }], expectMutate: true },
    ];

    for (const row of table) {
      const principal = normalizeAuthMeResponse({ claims: row.claims });

      expect(operateCapabilityFromRank(principal.authorityRank)).toBe(row.expectMutate);
    }
  });

  it("documents synthetic shell principals used before /me settles (bootstrap vs test outside-provider)", () => {
    expect(shellBootstrapReadPrincipal.authorityRank).toBe(AUTHORITY_RANK.ReadAuthority);
    expect(operateCapabilityFromRank(shellBootstrapReadPrincipal.authorityRank)).toBe(false);

    expect(operatorNavOutsideProviderPrincipal.authorityRank).toBe(AUTHORITY_RANK.AdminAuthority);
    expect(operateCapabilityFromRank(operatorNavOutsideProviderPrincipal.authorityRank)).toBe(true);
  });

  /**
   * Core Pilot defaults must stay broad: accidental `requiredAuthority` on essentials would regress the default path
   * for Reader-tier pilots (see `nav-config` Authority block).
   */
  it("keeps Core Pilot essential destinations visible for Reader with default tier toggles (extended off)", () => {
    const core = NAV_GROUPS.find((g) => g.id === "pilot");

    expect(core).toBeDefined();

    const visible = filterNavLinksForOperatorShell(
      core!.links,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      false,
      true,
    );
    const hrefs = new Set(visible.map((l) => l.href));

    expect(hrefs.has(SPONSOR_DASHBOARD_HREF)).toBe(true);
    expect(hrefs.has("/architecture/architectures")).toBe(true);
    expect(hrefs.has("/architecture/reviews")).toBe(true);
  });

  /**
   * Single numeric floor for Execute-class nav rows and Enterprise mutation soft-enable (`AUTHORITY_RANK.ExecuteAuthority`).
   * Catches accidental divergence if either helper changes threshold independently.
   */
  it("matches operateCapabilityFromRank to ExecuteAuthority nav visibility for ranks 0 through Admin", () => {
    const executeTierLink = {
      href: "/_seam-probe-execute",
      label: "Probe",
      title: "Probe",
      tier: "essential" as const,
      requiredAuthority: "ExecuteAuthority" as const,
    };

    for (let rank = 0; rank <= AUTHORITY_RANK.AdminAuthority; rank += 1) {
      expect(operateCapabilityFromRank(rank)).toBe(
        navLinkVisibleForCallerRank(executeTierLink, rank),
      );
    }
  });

  /**
   * End-to-end strip for first-pilot Reader: `listNavGroupsVisibleInOperatorShell` omits the Operate governance
   * cluster until progressive disclosure opts into advanced tiers (Alerts, Audit, and governance workflow hubs).
   * Findings lives in the Governance group at extended tier. System health stays under **`operator-admin`**
   * (`platform-admin` surface).
   */
  it("Reader default shell lists Pilot and operate-governance (tier/unlock retired — authority-only)", () => {
    const rows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      false,
      "all",
      true,
    );

    const ids = rows.map((r) => r.group.id);

    expect(ids).toContain("pilot");
    expect(ids).toContain("operate-governance");
  });

  it("Reader sees Findings in the Governance group without disclosure toggles", () => {
    const rows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      false,
      "all",
      true,
      0,
    );

    const governance = rows.find((r) => r.group.id === "operate-governance");
    const hrefs = governance?.visibleLinks.map((l) => l.href) ?? [];

    expect(hrefs).toContain("/governance/findings");
  });

  /**
   * Auditor maps to Read rank in `normalizeAuthMeResponse` but is a distinct primary role for audit UX; Enterprise nav
   * filtering must still match literal Read rank so Execute-tier hrefs stay omitted.
   */
  it("filters Enterprise nav links for Auditor /me principal the same as for ReadAuthority rank", () => {
    expect(enterpriseLinks).toBeDefined();

    const auditorRank = normalizeAuthMeResponse({
      claims: [{ type: "roles", value: "Auditor" }],
    }).authorityRank;

    expect(auditorRank).toBe(AUTHORITY_RANK.ReadAuthority);

    const fromAuditor = filterNavLinksByAuthority(enterpriseLinks!, auditorRank).map((l) => l.href);
    const fromRead = filterNavLinksByAuthority(enterpriseLinks!, AUTHORITY_RANK.ReadAuthority).map((l) => l.href);

    expect(fromAuditor).toEqual(fromRead);
  });

  /**
   * `filterNavLinksByAuthority` is monotonic in caller rank: higher rank never loses hrefs that a lower rank already saw.
   * Catches an accidental `>` vs `>=` flip on `requiredAuthorityRank` that would shrink the operator strip at Admin.
   */
  it("expands Operate governance href set monotonically from Read through Execute to Admin (authority filter only)", () => {
    expect(enterpriseLinks).toBeDefined();

    const hrefsRead = new Set(
      filterNavLinksByAuthority(enterpriseLinks!, AUTHORITY_RANK.ReadAuthority).map((l) => l.href),
    );
    const hrefsExecute = new Set(
      filterNavLinksByAuthority(enterpriseLinks!, AUTHORITY_RANK.ExecuteAuthority).map((l) => l.href),
    );
    const hrefsAdmin = new Set(
      filterNavLinksByAuthority(enterpriseLinks!, AUTHORITY_RANK.AdminAuthority).map((l) => l.href),
    );

    for (const href of hrefsRead) {
      expect(hrefsExecute.has(href), href).toBe(true);
    }

    for (const href of hrefsExecute) {
      expect(hrefsAdmin.has(href), href).toBe(true);
    }
  });

  /**
   * Tier disclosure is retired (owner 2026-08-03): the Analysis group must expose its whole link set at Admin rank
   * regardless of the legacy `showExtended` / `showAdvanced` arguments. Regression: reintroducing tier-based hiding
   * would silently shrink the sidebar for pilots.
   */
  it("keeps full Operate analysis link set when disclosure flags are off (tiering retired)", () => {
    const analysis = NAV_GROUPS.find((g) => g.id === "operate-analysis");

    expect(analysis, "Operate analysis group should remain configured").toBeDefined();

    const visible = filterNavLinksForOperatorShell(
      analysis!.links,
      false,
      false,
      AUTHORITY_RANK.AdminAuthority,
      false,
      true,
    );

    expect(visible.map((l) => l.href)).toEqual(analysis!.links.map((l) => l.href));
  });

  it("surfaces governance workflow for Execute rank without advanced disclosure", () => {
    expect(enterpriseLinks).toBeDefined();

    const gatedOff = filterNavLinksForOperatorShell(
      enterpriseLinks!,
      false,
      false,
      AUTHORITY_RANK.ExecuteAuthority,
      false,
      true,
    );

    expect(gatedOff.some((l) => l.href === "/governance/approval-queue")).toBe(true);

    const gatedAdvancedOnly = filterNavLinksForOperatorShell(
      enterpriseLinks!,
      false,
      true,
      AUTHORITY_RANK.ExecuteAuthority,
      false,
      true,
    );

    expect(gatedAdvancedOnly.some((l) => l.href === "/governance/approval-queue")).toBe(true);

    const gatedExtendedAndAdvanced = filterNavLinksForOperatorShell(
      enterpriseLinks!,
      true,
      true,
      AUTHORITY_RANK.ExecuteAuthority,
      false,
      true,
    );

    expect(gatedExtendedAndAdvanced.some((l) => l.href === "/governance/approval-queue")).toBe(true);
  });

  /**
   * `useNavCallerAuthorityRank` can be **0** while JWT **`/me`** is unset (`OperatorNavAuthorityProvider`). That is stricter
   * than Reader for **`ReadAuthority`**-gated links — catches `navLinkVisibleForCallerRank` accidentally treating **0** like Read.
   */
  it("hides ReadAuthority-gated nav from caller rank 0 while Read rank still passes", () => {
    const readOnlyLink = {
      href: "/_probe-read-tier-nav",
      label: "Probe",
      title: "",
      tier: "extended" as const,
      requiredAuthority: "ReadAuthority" as const,
    };

    expect(navLinkVisibleForCallerRank(readOnlyLink, 0)).toBe(false);
    expect(navLinkVisibleForCallerRank(readOnlyLink, AUTHORITY_RANK.ReadAuthority)).toBe(true);
  });

  /**
   * Default Operate governance strip: Alerts hub aligns with Audit and governance workflow under **`advanced`** tier.
   * Tier no longer gates visibility, but it still feeds packaging docs and navigation telemetry.
   */
  it("keeps Operate governance Alerts inbox on advanced tier in nav-config", () => {
    const alerts = enterpriseLinks?.find((l) => l.href === "/governance/alerts");

    expect(alerts?.tier).toBe("advanced");
  });

  /**
   * Sidebar / palette iterate filtered links in **`nav-config`** order; a `.sort()` or Set iteration in the filter would
   * churn UX and complicate deep-link expectations.
   */
  it("preserves nav-config link order when filtering Operate governance by authority", () => {
    expect(enterpriseLinks).toBeDefined();

    const filtered = filterNavLinksByAuthority(enterpriseLinks!, AUTHORITY_RANK.AdminAuthority);
    const hrefOrder = enterpriseLinks!.map((l) => l.href);
    const hrefSet = new Set(filtered.map((l) => l.href));
    const expectedOrder = hrefOrder.filter((href) => hrefSet.has(href));

    expect(filtered.map((l) => l.href)).toEqual(expectedOrder);
  });

  /**
   * **`listNavGroupsVisibleInOperatorShell`** walks **`NAV_GROUPS`** in file order; emitting groups out-of-order would
   * regress sidebar / mobile drawer composition without a type error.
   */
  it("preserves NAV_GROUPS order in listNavGroupsVisibleInOperatorShell for default Reader shell", () => {
    const rows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      false,
      "all",
      true,
    );
    const indexById = new Map(NAV_GROUPS.map((g, i) => [g.id, i] as const));
    const indices = rows.map((r) => indexById.get(r.group.id));

    for (const idx of indices) {
      expect(idx).toBeDefined();
    }

    for (let i = 1; i < indices.length; i++) {
      expect(indices[i]!).toBeGreaterThan(indices[i - 1]!);
    }
  });

  /**
   * `LayerHeader` treats `enterpriseFootnote` as the Enterprise Controls signal (rank cue + footnote typography).
   * Missing copy would regress buyer-facing packaging without a type error.
   */
  it("requires non-empty useWhen, firstPilotNote, and enterpriseFootnote on every governance LayerHeader guidance block", () => {
    const enterpriseBlocks = (Object.values(LAYER_PAGE_GUIDANCE) as LayerGuidanceBlock[]).filter(
      (b) => b.enterpriseFootnote != null,
    );

    expect(enterpriseBlocks.length).toBeGreaterThan(0);

    for (const block of enterpriseBlocks) {
      expect(block.useWhen.trim().length, block.headline).toBeGreaterThan(0);
      expect(block.firstPilotNote?.trim().length, block.headline).toBeGreaterThan(0);
      expect(block.enterpriseFootnote?.trim().length, block.headline).toBeGreaterThan(0);
    }
  });

  /**
   * Advanced pages must not set `enterpriseFootnote`: `LayerHeader` uses its presence to style `useWhen` and only
   * renders the Enterprise rank cue when the guidance block carries a governance footnote — not a string match on headlines.
   */
  it("keeps enterpriseFootnote unset on Advanced operations guidance blocks", () => {
    const advancedBlocks = (Object.values(LAYER_PAGE_GUIDANCE) as LayerGuidanceBlock[]).filter(
      (b) => b.layerBadge === "Advanced operations",
    );

    expect(advancedBlocks.length).toBeGreaterThan(0);

    for (const block of advancedBlocks) {
      expect(block.enterpriseFootnote, block.headline).toBeFalsy();
    }
  });
});
