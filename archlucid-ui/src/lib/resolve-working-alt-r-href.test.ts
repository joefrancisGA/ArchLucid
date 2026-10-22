import { describe, expect, it } from "vitest";

import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import {
  isForbiddenWorkingAltRTarget,
  resolveWorkingAltRHref,
} from "@/lib/resolve-working-alt-r-href";

describe("resolveWorkingAltRHref (SY-07 / ADR 0079)", () => {
  it("opens last-open architecture desk when architecture id is cached", () => {
    expect(resolveWorkingAltRHref({ lastOpenArchitectureId: "architecture-identity-001" })).toEqual({
      href: "/architecture/architectures/architecture-identity-001",
      reason: "last-open-architecture",
    });
  });

  it("falls back to portfolio when no architecture is open", () => {
    expect(resolveWorkingAltRHref({})).toEqual({
      href: "/architecture/architectures",
      reason: "portfolio",
    });
  });

  it("never targets the reviews inbox", () => {
    const scenarios = [
      resolveWorkingAltRHref({ lastOpenArchitectureId: "arch-1" }),
      resolveWorkingAltRHref({}),
    ];

    for (const result of scenarios) {
      expect(result.href).not.toBe(REVIEWS_LIST_PATH);
      expect(isForbiddenWorkingAltRTarget(result.href)).toBe(false);
    }
  });
});
