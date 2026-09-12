import { describe, expect, it } from "vitest";

import { architectureNestedSearchPath } from "@/lib/architecture/architecture-routes";
import { resolveWorkingPeerSearchRedirectHref } from "@/lib/resolve-working-peer-search-redirect-href";

describe("resolveWorkingPeerSearchRedirectHref (SY-42 / ADR 0079 / SN-026)", () => {
  const architectureId = "architecture-identity-001";

  it("redirects peer search to nested search with query preserved", () => {
    expect(
      resolveWorkingPeerSearchRedirectHref({
        pathname: "/insights/search-review-evidence",
        search: "?q=encryption",
        lastOpenArchitectureId: architectureId,
      }),
    ).toBe(`${architectureNestedSearchPath(architectureId)}?q=encryption`);
  });

  it("keeps unscoped Working on peer search when no architecture is known", () => {
    expect(
      resolveWorkingPeerSearchRedirectHref({
        pathname: "/insights/search-review-evidence",
      }),
    ).toBeNull();
  });

  it("returns null for non-peer paths", () => {
    expect(
      resolveWorkingPeerSearchRedirectHref({
        pathname: architectureNestedSearchPath(architectureId),
        lastOpenArchitectureId: architectureId,
      }),
    ).toBeNull();
  });
});
