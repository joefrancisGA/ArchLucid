import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NAV_GROUPS, type NavGroupConfig } from "@/lib/nav-config";
import { isAuditNavPath } from "@/lib/audit-nav-paths";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { applyAuditNavRunScope } from "@/lib/nav-audit-run-scope";
import {
  filterNavLinksForOperatorShell,
  listNavGroupsVisibleInOperatorShell,
  visibleOperatorShellHrefSet,
} from "@/lib/nav-shell-visibility";

describe("filterNavLinksForOperatorShell", () => {
  const enterprise = NAV_GROUPS.find((g) => g.id === "operate-governance");

  it("shows ReadAuthority governance links for Reader when disclosure flags are off (tiering retired)", () => {
    expect(enterprise).toBeDefined();

    const visible = filterNavLinksForOperatorShell(enterprise!.links, AUTHORITY_RANK.ReadAuthority, true);

    expect(visible.some((l) => l.href === "/governance/alerts")).toBe(true);
    expect(visible.some((l) => l.href === "/governance/policy-packs")).toBe(true);
    expect(visible.some((l) => l.href === "/governance/findings")).toBe(true);
    expect(visible.some((l) => l.href === "/governance/approval-queue")).toBe(true);
    expect(visible.length).toBeGreaterThan(0);
  });

  it("keeps the same Reader governance set when extended disclosure is on (tiering retired)", () => {
    expect(enterprise).toBeDefined();

    const visible = filterNavLinksForOperatorShell(enterprise!.links, AUTHORITY_RANK.ReadAuthority, true);

    expect(visible.some((l) => l.href === "/governance/policy-packs")).toBe(true);
    expect(visible.some((l) => l.href === "/governance/alerts")).toBe(true);
    expect(visible.some((l) => l.href === "/governance/audit")).toBe(true);
    expect(visible.some((l) => l.href === "/governance/findings")).toBe(true);
    expect(visible.some((l) => l.href === "/governance/approval-queue")).toBe(true);
  });

  it("keeps Alerts, Audit, approval queue, and policy packs for Reader when only advanced flag is on", () => {
    expect(enterprise).toBeDefined();

    const visible = filterNavLinksForOperatorShell(enterprise!.links, AUTHORITY_RANK.ReadAuthority, true);

    expect(visible.some((l) => l.href === "/governance/alerts")).toBe(true);
    expect(visible.some((l) => l.href === "/governance/audit")).toBe(true);
    expect(visible.some((l) => l.href === "/governance/approval-queue")).toBe(true);
    expect(visible.some((l) => l.href === "/governance/policy-packs")).toBe(true);
  });

  it("shows policy packs for Admin rank when extended links are enabled", () => {
    expect(enterprise).toBeDefined();

    const visible = filterNavLinksForOperatorShell(enterprise!.links, AUTHORITY_RANK.AdminAuthority, true);

    expect(visible.some((l) => l.href === "/governance/policy-packs")).toBe(true);
  });

  /**
   * Approval queue (/governance) browsing moved from ExecuteAuthority to ReadAuthority (matches
   * `GovernanceController`'s class-level `[Authorize(ReadAuthority)]` default for dashboard/list/lineage/rationale
   * reads); approve/reject/promote/activate remain Execute-gated via `canMutateWorkflow` inside
   * `GovernanceWorkflowPageContent`, not this nav link.
   */
  it("shows the approval queue for Reader once both extended and advanced tiers are on", () => {
    const visible = filterNavLinksForOperatorShell(enterprise!.links, AUTHORITY_RANK.ReadAuthority, true);

    expect(visible.some((l) => l.href === "/governance/approval-queue")).toBe(true);
    expect(visible.some((l) => l.href === "/governance/findings")).toBe(true);
  });

  it("shows extended and advanced governance links when disclosure flags are off (tiering retired)", () => {
    expect(enterprise).toBeDefined();

    const visible = filterNavLinksForOperatorShell(enterprise!.links, AUTHORITY_RANK.ExecuteAuthority, true);

    expect(visible.some((l) => l.href === "/governance/policy-packs")).toBe(true);
    expect(visible.some((l) => l.href === "/governance/approval-queue")).toBe(true);
    expect(visible.some((l) => l.href === "/governance/alerts")).toBe(true);
  });

  it("shows system health in System Administration for Admin rank when advanced and extended disclosure are on", () => {
    const systemAdmin = NAV_GROUPS.find((g) => g.id === "operator-system-admin");

    expect(systemAdmin).toBeDefined();

    const visible = filterNavLinksForOperatorShell(systemAdmin!.links, AUTHORITY_RANK.AdminAuthority, true);

    expect(visible.some((l) => l.href === "/internal/health")).toBe(true);
    expect(visible.some((l) => l.href === "/internal/configuration")).toBe(true);
  });

  it("shows System Administration Execute link (/replay) for Admin even when showExtended is off", () => {
    const systemAdmin = NAV_GROUPS.find((g) => g.id === "operator-system-admin");

    expect(systemAdmin).toBeDefined();

    const extendedOff = filterNavLinksForOperatorShell(systemAdmin!.links, AUTHORITY_RANK.AdminAuthority, true);

    expect(extendedOff.some((l) => l.href === "/internal/validate-route")).toBe(true);

    const extendedOn = filterNavLinksForOperatorShell(systemAdmin!.links, AUTHORITY_RANK.AdminAuthority, true);

    expect(extendedOn.some((l) => l.href === "/internal/validate-route")).toBe(true);
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
    const rows = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, AUTHORITY_RANK.ReadAuthority, "all", true);

    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      expect(row.visibleLinks.length).toBeGreaterThan(0);
    }
  });

  it("keeps extended-only groups when disclosure flags are off (tiering retired)", () => {
    const rowsOff = listNavGroupsVisibleInOperatorShell(syntheticExtendedOnly, AUTHORITY_RANK.ReadAuthority, "all", true);

    expect(rowsOff).toHaveLength(1);
    expect(rowsOff[0]!.group.id).toBe("synthetic-extended-only");
    expect(rowsOff[0]!.visibleLinks.some((l) => l.href === "/synthetic-extended")).toBe(true);
  });

  // Authority can still zero a group when every link requires a higher rank.
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

    const rows = listNavGroupsVisibleInOperatorShell(executeOnlyGroup, AUTHORITY_RANK.ReadAuthority, "all", true);

    expect(rows).toEqual([]);
  });

  it("matches filterNavLinksForOperatorShell for the Enterprise group when extended is on", () => {
    const enterprise = NAV_GROUPS.find((g) => g.id === "operate-governance");

    expect(enterprise).toBeDefined();

    const fromList = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, AUTHORITY_RANK.ReadAuthority, "all", true).find((r) => r.group.id === "operate-governance");

    expect(fromList).toBeDefined();

    const fromFilter = filterNavLinksForOperatorShell(enterprise!.links, AUTHORITY_RANK.ReadAuthority, true);

    expect(fromList!.visibleLinks.map((l) => l.href)).toEqual(fromFilter.map((l) => l.href));
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

    const visible = filterNavLinksForOperatorShell(enterprise!.links, AUTHORITY_RANK.AdminAuthority, true);

    expect(visible.some((l) => l.href === "/governance/alerts")).toBe(true);
    expect(visible.some((l) => l.href === "/governance/audit")).toBe(true);

    expect(admin).toBeDefined();

    const adminVisible = filterNavLinksForOperatorShell(admin!.links, AUTHORITY_RANK.AdminAuthority, true);

    expect(adminVisible.some((l) => l.href === "/administration/security-trust")).toBe(true);
  });

  it("keeps governance destinations visible when NEXT_PUBLIC_DEMO_STATIC_OPERATOR is true", () => {
    expect(enterprise).toBeDefined();
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR = "true";

    const visible = filterNavLinksForOperatorShell(enterprise!.links, AUTHORITY_RANK.AdminAuthority, true);

    expect(visible.some((l) => l.href === "/governance/alerts")).toBe(true);
    expect(visible.some((l) => l.href === "/governance/audit")).toBe(true);

    expect(admin).toBeDefined();

    const adminVisible = filterNavLinksForOperatorShell(admin!.links, AUTHORITY_RANK.AdminAuthority, true);

    expect(adminVisible.some((l) => l.href === "/administration/security-trust")).toBe(true);
  });

  it("keeps operator-admin links visible in buyer-polished demo builds", () => {
    const admin = NAV_GROUPS.find((g) => g.id === "operator-admin");

    expect(admin).toBeDefined();
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";

    const visible = filterNavLinksForOperatorShell(admin!.links, AUTHORITY_RANK.AdminAuthority, true);

    expect(visible.some((l) => l.href === "/administration/users")).toBe(true);
    expect(visible.some((l) => l.href === "/administration/workspace-settings")).toBe(true);
    expect(visible.some((l) => l.href === "/administration/security-trust")).toBe(true);
  });
});

describe("listNavGroupsVisibleInOperatorShell — platform-admin surface", () => {
  it("returns operator-admin when surfaceFilter is platform-admin", () => {
    const rows = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, AUTHORITY_RANK.AdminAuthority, "platform-admin", true);

    expect(rows.map((r) => r.group.id)).toEqual(["operator-admin"]);
    expect(rows[0]!.visibleLinks.some((l) => l.href === "/administration/connection-status")).toBe(true);
    expect(rows[0]!.visibleLinks.some((l) => l.href === "/administration/system-health")).toBe(true);
    expect(rows[0]!.visibleLinks.some((l) => l.href === "/administration/users")).toBe(true);
    expect(rows[0]!.visibleLinks.some((l) => l.href === "/internal/pricing-quote-aging")).toBe(false);
  });

  it("omits Administration health links for Read and Execute callers without AdminAuthority (TB-647)", () => {
    const readRows = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, AUTHORITY_RANK.ReadAuthority, "all", true);

    expect(readRows.flatMap((r) => r.visibleLinks).some((l) => l.href === "/administration/system-health")).toBe(false);
    expect(readRows.flatMap((r) => r.visibleLinks).some((l) => l.href === "/administration/connection-status")).toBe(false);

    const executeRows = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, AUTHORITY_RANK.ExecuteAuthority, "all", true);

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

    const readVisible = filterNavLinksForOperatorShell(admin!.links, AUTHORITY_RANK.ReadAuthority, true);

    expect(readVisible.some((l) => l.href === "/administration/ai-usage")).toBe(false);

    const executeVisible = filterNavLinksForOperatorShell(admin!.links, AUTHORITY_RANK.ExecuteAuthority, true);

    expect(executeVisible.some((l) => l.href === "/administration/ai-usage")).toBe(false);

    const adminVisible = filterNavLinksForOperatorShell(admin!.links, AUTHORITY_RANK.AdminAuthority, true);

    expect(adminVisible.some((l) => l.href === "/administration/ai-usage")).toBe(true);
  });
});

describe("listNavGroupsVisibleInOperatorShell — system-admin surface", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("omits internal sales-ops nav unless NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR is set", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR", "");

    const hidden = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, AUTHORITY_RANK.AdminAuthority, "all", true);

    expect(hidden.some((r) => r.group.id === "operator-system-admin")).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR", "true");

    const visible = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, AUTHORITY_RANK.AdminAuthority, "system-admin", true);

    expect(visible.map((r) => r.group.id)).toEqual(["operator-system-admin"]);
    expect(visible[0]!.visibleLinks.map((l) => l.href)).toContain("/internal/pricing-quote-aging");
    expect(visible[0]!.visibleLinks.map((l) => l.href)).toContain("/internal/rag-health");
    expect(visible[0]!.visibleLinks.map((l) => l.label)).toContain("Knowledge index health");
    expect(visible[0]!.visibleLinks.map((l) => l.href)).toContain("/internal/validate-route");
  });

  it("omits internal operations in public demo mode even when internal operator flag is set", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR", "true");
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");

    const visible = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, AUTHORITY_RANK.AdminAuthority, "all", true);

    expect(visible.some((row) => row.group.id === "operator-system-admin")).toBe(false);
  });
});

describe("committed architecture review gate — operator shell composition", () => {
  it("TB-2133: hides Operate groups before first committed review and restores them after", () => {
    const preCommit = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, AUTHORITY_RANK.AdminAuthority, "all", false);
    const preCommitIds = preCommit.map((r) => r.group.id);

    expect(preCommitIds).toContain("pilot");
    expect(preCommitIds).not.toContain("operate-governance");
    expect(preCommitIds).not.toContain("operate-integrations");

    const postCommit = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, AUTHORITY_RANK.AdminAuthority, "all", true);
    const postCommitIds = postCommit.map((r) => r.group.id);

    expect(postCommitIds).toContain("pilot");
    expect(postCommitIds).toContain("operate-governance");
    expect(postCommitIds).toContain("operate-analysis");
    expect(postCommitIds).toContain("operator-admin");
  });
});

describe("visibleOperatorShellHrefSet", () => {
  it("matches the flattened href set from listNavGroupsVisibleInOperatorShell", () => {
    const rows = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, AUTHORITY_RANK.AdminAuthority, "all", true);
    const fromRows = new Set(rows.flatMap((r) => r.visibleLinks.map((l) => l.href)));
    const direct = visibleOperatorShellHrefSet(AUTHORITY_RANK.AdminAuthority, true);

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

    const visible = filterNavLinksForOperatorShell(op!.links, AUTHORITY_RANK.AdminAuthority, true);

    expect(visible.map((l) => l.href)).toContain("/insights/compare-two-reviews");
  });

  it("keeps operate-analysis links in buyer-polished shell when public demo thinning would hide them", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "1");
    vi.stubEnv("NEXT_PUBLIC_OPERATOR_EXPERIENCE", "");

    const op = NAV_GROUPS.find((g) => g.id === "operate-analysis");

    expect(op).toBeDefined();

    const visible = filterNavLinksForOperatorShell(op!.links, AUTHORITY_RANK.AdminAuthority, true);

    expect(visible.map((l) => l.href)).toEqual(
      expect.arrayContaining(["/insights/ask-review-questions", "/insights/search-review-evidence", "/insights/compare-two-reviews"]),
    );

    vi.unstubAllEnvs();
    process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = "operator";
  });
});

describe("listNavGroupsVisibleInOperatorShell — customer-facing nav labels", () => {
  it("does not expose operator persona in visible nav link labels", () => {
    const rows = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, AUTHORITY_RANK.AdminAuthority, "all", true);

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
