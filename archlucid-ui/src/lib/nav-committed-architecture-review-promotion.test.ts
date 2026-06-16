import { describe, expect, it } from "vitest";

import { NAV_GROUPS } from "@/lib/nav-config";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { filterNavLinksForOperatorShell } from "@/lib/nav-shell-visibility";

describe("committed architecture review nav promotion", () => {
  const analysis = NAV_GROUPS.find((g) => g.id === "operate-analysis");

  it("promotes Compare and Export into collapsed sidebar when tenant has a committed review", () => {
    expect(analysis).toBeDefined();

    const visible = filterNavLinksForOperatorShell(
      analysis!.links,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      true,
      true,
    );

    expect(visible.some((l) => l.href === "/compare")).toBe(true);
    expect(visible.some((l) => l.href === "/value-report/pilot")).toBe(true);
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
