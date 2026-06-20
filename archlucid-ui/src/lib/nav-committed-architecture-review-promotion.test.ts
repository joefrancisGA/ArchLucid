import { describe, expect, it } from "vitest";

import { NAV_GROUPS } from "@/lib/nav-config";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { filterNavLinksForOperatorShell } from "@/lib/nav-shell-visibility";

describe("committed architecture review nav promotion", () => {
  const analysis = NAV_GROUPS.find((g) => g.id === "operate-analysis");
  const operations = NAV_GROUPS.find((g) => g.id === "operate-operations");

  it("promotes Compare and Export to essential tier but keeps them out of the collapsed sidebar clusters", () => {
    expect(analysis).toBeDefined();
    expect(operations).toBeDefined();

    const collapsedAnalysis = filterNavLinksForOperatorShell(
      analysis!.links,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      true,
      true,
    );

    expect(collapsedAnalysis.some((l) => l.href === "/compare")).toBe(false);

    const collapsedOperations = filterNavLinksForOperatorShell(
      operations!.links,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      true,
      true,
    );

    expect(collapsedOperations.some((l) => l.href === "/value-report/pilot")).toBe(false);

    const expandedAnalysis = filterNavLinksForOperatorShell(
      analysis!.links,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      false,
      true,
    );

    expect(expandedAnalysis.some((l) => l.href === "/compare")).toBe(true);

    const expandedOperations = filterNavLinksForOperatorShell(
      operations!.links,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      false,
      true,
    );

    expect(expandedOperations.some((l) => l.href === "/value-report/pilot")).toBe(true);
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
