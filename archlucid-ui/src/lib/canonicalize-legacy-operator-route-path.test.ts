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

  it("maps retired /demo bookmark to the CTO demo tour entry", () => {
    expect(canonicalizeLegacyOperatorRoutePath("/demo")).toBe(
      "/architecture/reviews/claims-intake-modernization?ctoDemoTour=1",
    );
  });

  it("maps architectures namespace bookmarks without rewriting canonical paths", () => {
    expect(canonicalizeLegacyOperatorRoutePath("/architectures")).toBe("/architecture/architectures");
    expect(canonicalizeLegacyOperatorRoutePath("/architectures/draft-1")).toBe(
      "/architecture/architectures/draft-1",
    );
    expect(canonicalizeLegacyOperatorRoutePath("/architecture/architectures/draft-1")).toBe(
      "/architecture/architectures/draft-1",
    );
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
    expect(canonicalizeLegacyOperatorRoutePath("/settings/roles")).toBe("/administration/users");
    expect(canonicalizeLegacyOperatorRoutePath("/settings/cloud-connections")).toBe(
      "/integrations/cloud-connections",
    );
    expect(canonicalizeLegacyOperatorRoutePath("/settings/identity-providers")).toBe(
      "/administration/identity-providers",
    );
    expect(canonicalizeLegacyOperatorRoutePath("/settings/identity/sso-wizard")).toBe(
      "/administration/identity/sso-wizard",
    );
  });

  it("maps legacy AI usage admin bookmark to canonical administration path (TB-1404)", () => {
    expect(canonicalizeLegacyOperatorRoutePath("/admin/ai-usage-cost")).toBe("/administration/ai-usage");
  });
});
