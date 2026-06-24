import { describe, expect, it } from "vitest";

import { NAV_GROUPS } from "@/lib/nav-config";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { filterNavLinksForOperatorShell } from "@/lib/nav-shell-visibility";

describe("committed architecture review nav promotion", () => {
  const analysis = NAV_GROUPS.find((g) => g.id === "operate-analysis");
  const systemAdmin = NAV_GROUPS.find((g) => g.id === "operator-system-admin");

  it("promotes Compare to essential tier but keeps it out of the collapsed sidebar clusters", () => {
    expect(analysis).toBeDefined();
    expect(systemAdmin).toBeDefined();

    const collapsedAnalysis = filterNavLinksForOperatorShell(
      analysis!.links,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      true,
      true,
    );

    expect(collapsedAnalysis.some((l) => l.href === "/compare")).toBe(false);

    const collapsedSystemAdmin = filterNavLinksForOperatorShell(
      systemAdmin!.links,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      true,
      true,
    );

    expect(collapsedSystemAdmin.some((l) => l.href === "/value-report/pilot")).toBe(false);

    const expandedAnalysis = filterNavLinksForOperatorShell(
      analysis!.links,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      false,
      true,
    );

    expect(expandedAnalysis.some((l) => l.href === "/compare")).toBe(true);

    const expandedSystemAdmin = filterNavLinksForOperatorShell(
      systemAdmin!.links,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      false,
      true,
    );

    expect(expandedSystemAdmin.some((l) => l.href === "/value-report/pilot")).toBe(true);
  });

  it("keeps Compare hidden in collapsed sidebar before the first committed review", () => {
    expect(analysis).toBeDefined();

    const visible = filterNavLinksForOperatorShell(
      analysis!.links,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      true,
      false,
    );

    expect(visible.some((l) => l.href === "/compare")).toBe(false);
  });
});
