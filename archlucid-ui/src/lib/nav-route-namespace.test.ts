import { describe, expect, it } from "vitest";

import { NAV_GROUPS } from "@/lib/nav-config";
import { NAV_ROUTE_NAMESPACE_EXCEPTIONS } from "@/lib/nav-route-namespace-exceptions";
import {
  hrefMatchesAnyCanonicalPrefix,
  isNavHrefNamespaceAligned,
  NAV_GROUP_CANONICAL_PREFIX_POLICIES,
} from "@/lib/nav-route-namespace-policy";

describe("nav route namespace policy (TB-404)", () => {
  it("aligns every configured nav href with its group prefix or the exception registry", () => {
    const violations: string[] = [];

    for (const group of NAV_GROUPS) {
      for (const link of group.links) {
        if (!isNavHrefNamespaceAligned(group.id, link.href, NAV_GROUP_CANONICAL_PREFIX_POLICIES, NAV_ROUTE_NAMESPACE_EXCEPTIONS)) {
          violations.push(`${group.id} → ${link.href}`);
        }
      }
    }

    expect(violations, `Undocumented cross-namespace nav hrefs:\n${violations.join("\n")}`).toEqual([]);
  });

  it("lists only hrefs that actually appear in the matching nav group", () => {
    const flatByGroup = new Map(NAV_GROUPS.map((group) => [group.id, new Set(group.links.map((link) => link.href))]));

    for (const row of NAV_ROUTE_NAMESPACE_EXCEPTIONS) {
      const hrefs = flatByGroup.get(row.navGroupId);

      expect(hrefs, row.navGroupId).toBeDefined();
      expect(hrefs!.has(row.href), `${row.navGroupId} exception for missing href ${row.href}`).toBe(true);
    }
  });

  it("requires non-empty exception reasons", () => {
    for (const row of NAV_ROUTE_NAMESPACE_EXCEPTIONS) {
      expect(row.exceptionReason.trim().length, row.href).toBeGreaterThan(0);
    }
  });

  it("does not duplicate exception rows for the same group and href", () => {
    const keys = NAV_ROUTE_NAMESPACE_EXCEPTIONS.map((row) => `${row.navGroupId}::${row.href}`);
    const dupes = keys.filter((key, index) => keys.indexOf(key) !== index);

    expect([...new Set(dupes)]).toEqual([]);
  });

  it("covers every cross-namespace href with an explicit registry row", () => {
    const undocumentedCrossNamespace: string[] = [];

    for (const group of NAV_GROUPS) {
      const policy = NAV_GROUP_CANONICAL_PREFIX_POLICIES.find((row) => row.navGroupId === group.id);

      if (policy === undefined || policy.canonicalPrefixes === null) {
        continue;
      }

      for (const link of group.links) {
        if (hrefMatchesAnyCanonicalPrefix(link.href, policy.canonicalPrefixes)) {
          continue;
        }

        const registered = NAV_ROUTE_NAMESPACE_EXCEPTIONS.some(
          (row) => row.navGroupId === group.id && row.href === link.href,
        );

        if (!registered) {
          undocumentedCrossNamespace.push(`${group.id} → ${link.href}`);
        }
      }
    }

    expect(undocumentedCrossNamespace).toEqual([]);
  });
});
