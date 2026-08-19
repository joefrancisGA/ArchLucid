import { describe, expect, it } from "vitest";

import type { NavLinkItem } from "@/lib/nav-config.types";
import { applyAuditNavRunScope } from "@/lib/nav-audit-run-scope";

describe("applyAuditNavRunScope", () => {
  const links: NavLinkItem[] = [
    {
      href: "/governance/audit",
      label: "Audit trail",
      title: "See who did what and when",
      tier: "advanced",
      requiredAuthority: "ReadAuthority",
    },
    {
      href: "/governance/findings",
      label: "Findings",
      title: "Track owned architecture risks",
      tier: "extended",
      requiredAuthority: "ReadAuthority",
    },
  ];

  it("scopes audit nav hrefs when runId is known (TB-649)", () => {
    const scoped = applyAuditNavRunScope(links, "run-abc");

    expect(scoped[0]?.href).toBe("/governance/audit?runId=run-abc");
    expect(scoped[1]?.href).toBe("/governance/findings");
  });

  it("leaves audit hrefs unscoped when runId is absent", () => {
    const scoped = applyAuditNavRunScope(links, null);

    expect(scoped[0]?.href).toBe("/governance/audit");
  });
});
