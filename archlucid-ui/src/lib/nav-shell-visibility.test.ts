import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";
import { NAV_GROUPS, type NavGroupConfig } from "@/lib/nav-config";
import { isAuditNavPath } from "@/lib/audit-nav-paths";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { applyAuditNavRunScope } from "@/lib/nav-audit-run-scope";
import {
  countLinksHiddenByProgressiveDisclosure,
  countSidebarLinksHiddenByCollapsedPilot,
  countSidebarLinksRevealedByShowAllFeatures,
  filterNavLinksForOperatorShell,
  listNavGroupsVisibleInOperatorShell,
  visibleOperatorShellHrefSet,
} from "@/lib/nav-shell-visibility";

describe("filterNavLinksForOperatorShell", () => {
  const enterprise = NAV_GROUPS.find((g) => g.id === "operate-governance");

  it("omits operate-governance links for Reader when extended and advanced tiers are both off", () => {
    expect(enterprise).toBeDefined();

    const visible = filterNavLinksForOperatorShell(
      enterprise!.links,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      false,
      true,
    );

    expect(visible.some((l) => l.href === "/governance/alerts")).toBe(false);
    expect(visible.some((l) => l.href === "/governance/policy-packs")).toBe(false);
    expect(visible).toHaveLength(0);
  });

  /**
   * Default shell (no extended / no advanced): the Governance group has no visible links at Read rank, so the cluster
   * is omitted from `listNavGroupsVisibleInOperatorShell` (progressive disclosure for pilot / new operators).
   */
  it("exposes read-tier extended Enterprise links for Reader when extended disclosure is on without advanced", () => {
    expect(enterprise).toBeDefined();

    const visible = filterNavLinksForOperatorShell(
      enterprise!.links,
      true,
      false,
      AUTHORITY_RANK.ReadAuthority,
      false,
      true,
    );

    expect(visible.some((l) => l.href === "/governance/policy-packs")).toBe(true);
    expect(visible.some((l) => l.href === "/governance/alerts")).toBe(false);
    expect(visible.some((l) => l.href === "/governance/audit")).toBe(false);
    expect(visible.some((l) => l.href === "/governance/findings")).toBe(true);
    expect(visible.some((l) => l.href === "/governance")).toBe(false);
  });

  it("exposes Alerts, Audit, and the approval queue for Reader when advanced disclosure is on even if extended is off", () => {
    expect(enterprise).toBeDefined();

    const visible = filterNavLinksForOperatorShell(
      enterprise!.links,
      false,
      true,
      AUTHORITY_RANK.ReadAuthority,
      false,
      true,
    );

    // Approval-queue (/governance) browsing moved to ReadAuthority — it's visible here alongside Alerts/Audit once
    // the "advanced" tier is on; approve/reject/promote/activate stay Execute-gated inside the page itself.
    expect(visible.some((l) => l.href === "/governance/alerts")).toBe(true);
    expect(visible.some((l) => l.href === "/governance/audit")).toBe(true);
    expect(visible.some((l) => l.href === "/governance")).toBe(true);
    expect(visible.some((l) => l.href === "/governance/policy-packs")).toBe(false);
  });

  it("shows policy packs for Admin rank when extended links are enabled", () => {
    expect(enterprise).toBeDefined();

    const visible = filterNavLinksForOperatorShell(
      enterprise!.links,
      true,
      false,
      AUTHORITY_RANK.AdminAuthority,
      false,
      true,
    );

    expect(visible.some((l) => l.href === "/governance/policy-packs")).toBe(true);
  });

  /**
   * Approval queue (/governance) browsing moved from ExecuteAuthority to ReadAuthority (matches
   * `GovernanceController`'s class-level `[Authorize(ReadAuthority)]` default for dashboard/list/lineage/rationale
   * reads); approve/reject/promote/activate remain Execute-gated via `canMutateWorkflow` inside
   * `GovernanceWorkflowPageContent`, not this nav link.
   */
  it("shows the approval queue for Reader once both extended and advanced tiers are on", () => {
    const visible = filterNavLinksForOperatorShell(
      enterprise!.links,
      true,
      true,
      AUTHORITY_RANK.ReadAuthority,
      false,
      true,
    );

    expect(visible.some((l) => l.href === "/governance")).toBe(true);
    expect(visible.some((l) => l.href === "/governance/findings")).toBe(true);
  });

  /**
   * Tier runs before authority (`nav-shell-visibility`): higher rank must not “punch through” extended disclosure.
   * Regression: reordering filters or mis-stating tiers would expose `/policy-packs` without extended disclosure.
   */
  it("keeps extended-tier Enterprise links hidden when showExtended is off even for Execute rank and advanced on", () => {
    expect(enterprise).toBeDefined();

    const visible = filterNavLinksForOperatorShell(
      enterprise!.links,
      false,
      true,
      AUTHORITY_RANK.ExecuteAuthority,
      false,
      true,
    );

    expect(visible.some((l) => l.href === "/governance/policy-packs")).toBe(false);
    expect(visible.some((l) => l.href === "/governance")).toBe(true);
    expect(visible.some((l) => l.href === "/governance/alerts")).toBe(true);
  });

  /**
   * Default shell (no extended, no advanced): Execute-ranked operators see no Operate governance links until advanced
   * operations are enabled — same progressive disclosure as Reader (tier before authority).
   */
  it("omits Operate governance links for Execute rank when extended and advanced are off", () => {
    expect(enterprise).toBeDefined();

    const visible = filterNavLinksForOperatorShell(
      enterprise!.links,
      false,
      false,
      AUTHORITY_RANK.ExecuteAuthority,
      false,
      true,
    );

    expect(visible).toEqual([]);
  });

  it("shows system health in System Administration for Admin rank when advanced and extended disclosure are on", () => {
    const systemAdmin = NAV_GROUPS.find((g) => g.id === "operator-system-admin");

    expect(systemAdmin).toBeDefined();

    const visible = filterNavLinksForOperatorShell(
      systemAdmin!.links,
      true,
      true,
      AUTHORITY_RANK.AdminAuthority,
      false,
      true,
    );

    expect(visible.some((l) => l.href === "/admin/health")).toBe(true);
    expect(visible.some((l) => l.href === "/admin/configuration")).toBe(true);
  });

  /**
   * Same tier gate as Enterprise extended links: `/replay` is **extended** + **ExecuteAuthority** — Admin rank must
   * not surface it until **Show analysis & investigation tools** (`nav-tier` before `nav-authority`).
   */
  it("hides System Administration extended Execute link (/replay) until showExtended even for Admin rank", () => {
    const systemAdmin = NAV_GROUPS.find((g) => g.id === "operator-system-admin");

    expect(systemAdmin).toBeDefined();

    const extendedOff = filterNavLinksForOperatorShell(
      systemAdmin!.links,
      false,
      false,
      AUTHORITY_RANK.AdminAuthority,
      false,
      true,
    );

    expect(extendedOff.some((l) => l.href === "/replay")).toBe(false);

    const extendedOn = filterNavLinksForOperatorShell(
      systemAdmin!.links,
      true,
      false,
      AUTHORITY_RANK.AdminAuthority,
      false,
      true,
    );

    expect(extendedOn.some((l) => l.href === "/replay")).toBe(true);
  });
});

describe("listNavGroupsVisibleInOperatorShell", () => {
  const syntheticExtendedOnly: NavGroupConfig[] = [
    {
      id: "synthetic-extended-only",
      label: "Synthetic",
      links: [
        {
          href: "/synthetic-extended",
          label: "Extended only",
          title: "Test",
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
      ],
    },
  ];

  it("never returns a group with zero visible links", () => {
    const rows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      true,
      true,
      AUTHORITY_RANK.ReadAuthority,
      false,
      "all",
      true,
    );

    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      expect(row.visibleLinks.length).toBeGreaterThan(0);
    }
  });

  it("omits a group when tier filtering removes every link", () => {
    const rowsOff = listNavGroupsVisibleInOperatorShell(
      syntheticExtendedOnly,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      false,
      "all",
      true,
    );

    expect(rowsOff).toEqual([]);

    const rowsOn = listNavGroupsVisibleInOperatorShell(
      syntheticExtendedOnly,
      true,
      false,
      AUTHORITY_RANK.ReadAuthority,
      false,
      "all",
      true,
    );

    expect(rowsOn).toHaveLength(1);
    expect(rowsOn[0]!.group.id).toBe("synthetic-extended-only");
    expect(rowsOn[0]!.visibleLinks.some((l) => l.href === "/synthetic-extended")).toBe(true);
  });

  // Complements the tier-only empty-group case: authority can zero a group even when tiers would allow the hrefs.
  it("omits a group when authority filtering removes every link (Execute-only group, Read caller)", () => {
    const executeOnlyGroup: NavGroupConfig[] = [
      {
        id: "synthetic-execute-only",
        label: "Synthetic",
        links: [
          {
            href: "/synthetic-exec-a",
            label: "A",
            title: "Test",
            tier: "essential",
            requiredAuthority: "ExecuteAuthority",
          },
          {
            href: "/synthetic-exec-b",
            label: "B",
            title: "Test",
            tier: "essential",
            requiredAuthority: "ExecuteAuthority",
          },
        ],
      },
    ];

    const rows = listNavGroupsVisibleInOperatorShell(
      executeOnlyGroup,
      true,
      true,
      AUTHORITY_RANK.ReadAuthority,
      false,
      "all",
      true,
    );

    expect(rows).toEqual([]);
  });

  it("matches filterNavLinksForOperatorShell for the Enterprise group when extended is on", () => {
    const enterprise = NAV_GROUPS.find((g) => g.id === "operate-governance");

    expect(enterprise).toBeDefined();

    const fromList = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      true,
      false,
      AUTHORITY_RANK.ReadAuthority,
      false,
      "all",
      true,
      2,
    ).find((r) => r.group.id === "operate-governance");

    expect(fromList).toBeDefined();

    const fromFilter = filterNavLinksForOperatorShell(
      enterprise!.links,
      true,
      false,
      AUTHORITY_RANK.ReadAuthority,
      false,
      true,
    );

    expect(fromList!.visibleLinks.map((l) => l.href)).toEqual(fromFilter.map((l) => l.href));
  });
});

describe("countLinksHiddenByProgressiveDisclosure", () => {
  it("is zero when extended and advanced are fully on", () => {
    const enterprise = NAV_GROUPS.find((g) => g.id === "operate-governance") as NavGroupConfig;

    const n = countLinksHiddenByProgressiveDisclosure(
      enterprise,
      true,
      true,
      AUTHORITY_RANK.ReadAuthority,
      true,
    );
    expect(n).toBe(0);
  });

  it("is positive when extended links are off but exist at full disclosure", () => {
    const enterprise = NAV_GROUPS.find((g) => g.id === "operate-governance") as NavGroupConfig;

    const n = countLinksHiddenByProgressiveDisclosure(
      enterprise,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      true,
    );
    expect(n).toBeGreaterThan(0);
  });
});

describe("collapsed pilot sidebar filter", () => {
  it("shows at most eight visible links for default Reader shell when collapsed filter is applied", () => {
    const rows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      true,
      "all",
      true,
    );
    const count = rows.reduce((sum, row) => sum + row.visibleLinks.length, 0);

    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(8);
  });

  it("exposes more links when collapsed filter is off at the same tier and rank", () => {
    const collapsed = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      true,
      "all",
      true,
    );
    const full = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      false,
      "all",
      true,
    );
    let c = 0;
    let f = 0;

    for (const row of collapsed) {
      c += row.visibleLinks.length;
    }

    for (const row of full) {
      f += row.visibleLinks.length;
    }

    expect(f).toBeGreaterThanOrEqual(c);
    expect(countSidebarLinksHiddenByCollapsedPilot(NAV_GROUPS, false, false, AUTHORITY_RANK.ReadAuthority, true)).toBe(
      f - c,
    );
  });
});

describe("countSidebarLinksRevealedByShowAllFeatures", () => {
  it("matches collapsed-pilot delta without navigation presets", () => {
    const collapsedOnly = countSidebarLinksHiddenByCollapsedPilot(
      NAV_GROUPS,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      true,
      1,
    );
    const revealed = countSidebarLinksRevealedByShowAllFeatures(
      NAV_GROUPS,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      true,
      1,
    );

    expect(revealed).toBe(collapsedOnly);
    expect(revealed).toBeGreaterThan(0);
  });
});

describe("filterNavLinksForOperatorShell — public demo nav omissions", () => {
  const enterprise = NAV_GROUPS.find((g) => g.id === "operate-governance");
  const admin = NAV_GROUPS.find((g) => g.id === "operator-admin");
  const prevDemo = process.env.NEXT_PUBLIC_DEMO_MODE;
  const prevStatic = process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;

  afterEach(() => {
    if (prevDemo === undefined) {
      delete process.env.NEXT_PUBLIC_DEMO_MODE;
    } else {
      process.env.NEXT_PUBLIC_DEMO_MODE = prevDemo;
    }

    if (prevStatic === undefined) {
      delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
    } else {
      process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR = prevStatic;
    }
  });

  it("keeps governance destinations visible in buyer-polished demo builds (NEXT_PUBLIC_DEMO_MODE)", () => {
    expect(enterprise).toBeDefined();
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";

    const visible = filterNavLinksForOperatorShell(
      enterprise!.links,
      true,
      true,
      AUTHORITY_RANK.AdminAuthority,
      false,
      true,
    );

    expect(visible.some((l) => l.href === "/governance/alerts")).toBe(true);
    expect(visible.some((l) => l.href === "/governance/audit")).toBe(true);

    expect(admin).toBeDefined();

    const adminVisible = filterNavLinksForOperatorShell(
      admin!.links,
      true,
      true,
      AUTHORITY_RANK.AdminAuthority,
      false,
      true,
    );

    expect(adminVisible.some((l) => l.href === "/settings/security-trust")).toBe(true);
  });

  it("keeps governance destinations visible when NEXT_PUBLIC_DEMO_STATIC_OPERATOR is true", () => {
    expect(enterprise).toBeDefined();
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR = "true";

    const visible = filterNavLinksForOperatorShell(
      enterprise!.links,
      true,
      true,
      AUTHORITY_RANK.AdminAuthority,
      false,
      true,
    );

    expect(visible.some((l) => l.href === "/governance/alerts")).toBe(true);
    expect(visible.some((l) => l.href === "/governance/audit")).toBe(true);

    expect(admin).toBeDefined();

    const adminVisible = filterNavLinksForOperatorShell(
      admin!.links,
      true,
      true,
      AUTHORITY_RANK.AdminAuthority,
      false,
      true,
    );

    expect(adminVisible.some((l) => l.href === "/settings/security-trust")).toBe(true);
  });

  it("keeps operator-admin links visible in buyer-polished demo builds", () => {
    const admin = NAV_GROUPS.find((g) => g.id === "operator-admin");

    expect(admin).toBeDefined();
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";

    const visible = filterNavLinksForOperatorShell(
      admin!.links,
      true,
      true,
      AUTHORITY_RANK.AdminAuthority,
      false,
      true,
    );

    expect(visible.some((l) => l.href === "/settings/users")).toBe(true);
    expect(visible.some((l) => l.href === "/settings/tenant")).toBe(true);
    expect(visible.some((l) => l.href === "/settings/security-trust")).toBe(true);
  });
});

describe("listNavGroupsVisibleInOperatorShell — platform-admin surface", () => {
  it("returns operator-admin when surfaceFilter is platform-admin", () => {
    const rows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      true,
      true,
      AUTHORITY_RANK.AdminAuthority,
      false,
      "platform-admin",
      true,
    );

    expect(rows.map((r) => r.group.id)).toEqual(["operator-admin"]);
    expect(rows[0]!.visibleLinks.some((l) => l.href === "/administration/connection-status")).toBe(true);
    expect(rows[0]!.visibleLinks.some((l) => l.href === "/administration/system-health")).toBe(true);
    expect(rows[0]!.visibleLinks.some((l) => l.href === "/settings/users")).toBe(true);
    expect(rows[0]!.visibleLinks.some((l) => l.href === "/admin/pricing-quote-aging")).toBe(false);
  });

  it("omits Administration health links for Read and Execute callers without AdminAuthority (TB-647)", () => {
    const readRows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      true,
      true,
      AUTHORITY_RANK.ReadAuthority,
      false,
      "all",
      true,
    );

    expect(readRows.flatMap((r) => r.visibleLinks).some((l) => l.href === "/administration/system-health")).toBe(false);
    expect(readRows.flatMap((r) => r.visibleLinks).some((l) => l.href === "/administration/connection-status")).toBe(false);

    const executeRows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      true,
      true,
      AUTHORITY_RANK.ExecuteAuthority,
      false,
      "all",
      true,
    );

    expect(executeRows.flatMap((r) => r.visibleLinks).some((l) => l.href === "/administration/system-health")).toBe(false);
    expect(executeRows.flatMap((r) => r.visibleLinks).some((l) => l.href === "/administration/connection-status")).toBe(false);
  });

  it("scopes governance audit nav when review context is known (TB-649)", () => {
    const enterprise = NAV_GROUPS.find((g) => g.id === "operate-governance");

    expect(enterprise).toBeDefined();

    const scoped = applyAuditNavRunScope(enterprise!.links, "run-abc");
    const auditLink = scoped.find((l) => isAuditNavPath(l.href.split("?")[0] ?? ""));

    expect(auditLink?.href).toBe("/governance/audit?runId=run-abc");
  });

  it("omits AI usage from Administration for Read and Execute callers (TB-648)", () => {
    const admin = NAV_GROUPS.find((g) => g.id === "operator-admin");

    expect(admin).toBeDefined();

    const readVisible = filterNavLinksForOperatorShell(
      admin!.links,
      true,
      true,
      AUTHORITY_RANK.ReadAuthority,
      false,
      true,
    );

    expect(readVisible.some((l) => l.href === "/settings/ai-usage")).toBe(false);

    const executeVisible = filterNavLinksForOperatorShell(
      admin!.links,
      true,
      true,
      AUTHORITY_RANK.ExecuteAuthority,
      false,
      true,
    );

    expect(executeVisible.some((l) => l.href === "/settings/ai-usage")).toBe(false);

    const adminVisible = filterNavLinksForOperatorShell(
      admin!.links,
      true,
      true,
      AUTHORITY_RANK.AdminAuthority,
      false,
      true,
    );

    expect(adminVisible.some((l) => l.href === "/settings/ai-usage")).toBe(true);
  });
});

describe("listNavGroupsVisibleInOperatorShell — system-admin surface", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("omits internal sales-ops nav unless NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR is set", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR", "");

    const hidden = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      true,
      true,
      AUTHORITY_RANK.AdminAuthority,
      false,
      "all",
      true,
    );

    expect(hidden.some((r) => r.group.id === "operator-system-admin")).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR", "true");

    const visible = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      true,
      true,
      AUTHORITY_RANK.AdminAuthority,
      false,
      "system-admin",
      true,
    );

    expect(visible.map((r) => r.group.id)).toEqual(["operator-system-admin"]);
    expect(visible[0]!.visibleLinks.map((l) => l.href)).toContain("/admin/pricing-quote-aging");
    expect(visible[0]!.visibleLinks.map((l) => l.href)).toContain("/admin/rag-health");
    expect(visible[0]!.visibleLinks.map((l) => l.label)).toContain("Knowledge index health");
    expect(visible[0]!.visibleLinks.map((l) => l.href)).toContain("/replay");
  });
});

describe("committed architecture review gate — operator shell composition", () => {
  it("narrows to Architecture reviews essentials until first committed review even at Admin + full tier disclosure", () => {
    const rows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      true,
      true,
      AUTHORITY_RANK.AdminAuthority,
      false,
      "all",
      false,
    );

    expect(rows.map((r) => r.group.id)).toEqual(["pilot", "operator-admin"]);
    expect(rows[0]!.visibleLinks.map((l) => l.href)).toEqual([
      "/",
      "/architectures",
      "/reviews?projectId=default",
      EXECUTIVE_DASHBOARD_HREF,
      "/architecture/first-review-guide",
    ]);
    expect(rows[1]!.visibleLinks.map((l) => l.href)).toEqual([
      "/settings/tenant",
      "/settings/tenant/recycle-bin",
    ]);
  });
});

describe("visibleOperatorShellHrefSet", () => {
  it("matches the flattened href set from listNavGroupsVisibleInOperatorShell", () => {
    const rows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      true,
      true,
      AUTHORITY_RANK.AdminAuthority,
      false,
      "all",
      true,
    );
    const fromRows = new Set(rows.flatMap((r) => r.visibleLinks.map((l) => l.href)));
    const direct = visibleOperatorShellHrefSet(true, true, AUTHORITY_RANK.AdminAuthority, true);

    expect(direct).toEqual(fromRows);
  });
});

describe("buyer-polished shell nav narrowing", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_OPERATOR_EXPERIENCE", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = "operator";
  });

  it("keeps compare reachable in operate-analysis for buyer-polished shell", () => {
    const op = NAV_GROUPS.find((g) => g.id === "operate-analysis");

    expect(op).toBeDefined();

    const visible = filterNavLinksForOperatorShell(op!.links, true, true, AUTHORITY_RANK.AdminAuthority, false, true);

    expect(visible.map((l) => l.href)).toContain("/compare");
  });

  it("keeps operate-analysis links in buyer-polished shell when public demo thinning would hide them", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "1");
    vi.stubEnv("NEXT_PUBLIC_OPERATOR_EXPERIENCE", "");

    const op = NAV_GROUPS.find((g) => g.id === "operate-analysis");

    expect(op).toBeDefined();

    const visible = filterNavLinksForOperatorShell(op!.links, true, true, AUTHORITY_RANK.AdminAuthority, false, true);

    expect(visible.map((l) => l.href)).toEqual(
      expect.arrayContaining(["/insights/ask-review-questions", "/search", "/compare"]),
    );

    vi.unstubAllEnvs();
    process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = "operator";
  });
});

describe("listNavGroupsVisibleInOperatorShell — customer-facing nav labels", () => {
  it("does not expose operator persona in visible nav link labels", () => {
    const rows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      true,
      true,
      AUTHORITY_RANK.AdminAuthority,
      false,
      "all",
      true,
    );

    for (const row of rows) {
      if (row.group.id === "operator-system-admin") {
        continue;
      }

      for (const link of row.visibleLinks) {
        expect(link.label.toLowerCase(), `${row.group.id}:${link.href}`).not.toMatch(/\boperator\b/);
      }
    }
  });
});
