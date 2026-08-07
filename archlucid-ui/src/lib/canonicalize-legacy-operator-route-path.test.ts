import { describe, expect, it } from "vitest";

import { canonicalizeLegacyOperatorRoutePath } from "@/lib/canonicalize-legacy-operator-route-path";

describe("canonicalizeLegacyOperatorRoutePath", () => {
  it("maps governance legacy bookmarks to canonical paths", () => {
    expect(canonicalizeLegacyOperatorRoutePath("/audit")).toBe("/governance/audit");
    expect(canonicalizeLegacyOperatorRoutePath("/policy-packs/abc")).toBe("/governance/policy-packs/abc");
    expect(canonicalizeLegacyOperatorRoutePath("/alerts")).toBe("/governance/alerts");
    expect(canonicalizeLegacyOperatorRoutePath("/alert-rules")).toBe("/governance/alert-rules");
  });

  it("maps reviews namespace bookmarks to architecture reviews", () => {
    expect(canonicalizeLegacyOperatorRoutePath("/runs")).toBe("/architecture/reviews");
    expect(canonicalizeLegacyOperatorRoutePath("/runs/abc")).toBe("/architecture/reviews/abc");
    expect(canonicalizeLegacyOperatorRoutePath("/reviews/new")).toBe("/architecture/reviews/new");
  });

  it("maps digests and exceptions legacy bookmarks to canonical paths", () => {
    expect(canonicalizeLegacyOperatorRoutePath("/digests")).toBe("/architecture/digests");
    expect(canonicalizeLegacyOperatorRoutePath("/digest-subscriptions")).toBe(
      "/architecture/digests?tab=subscriptions",
    );
    expect(canonicalizeLegacyOperatorRoutePath("/governance/risk-exceptions")).toBe("/governance/exceptions");
    expect(canonicalizeLegacyOperatorRoutePath("/manifests/demo-id")).toBe("/governance/signed-records/demo-id");
    expect(canonicalizeLegacyOperatorRoutePath("/signed-records/demo-id")).toBe(
      "/governance/signed-records/demo-id",
    );
  });
});
