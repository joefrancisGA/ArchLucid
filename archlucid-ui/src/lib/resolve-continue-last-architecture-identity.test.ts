import { beforeEach, describe, expect, it, vi } from "vitest";

import { OPERATOR_RECENT_VIEWS_STORAGE_KEY } from "@/lib/operator/operator-recent-views";
import { resolveContinueLastArchitectureIdentityTarget } from "@/lib/resolve-continue-last-architecture-identity";

describe("resolveContinueLastArchitectureIdentityTarget (CA-37)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns the identity desk href for the cached last-open architecture id", () => {
    window.localStorage.setItem("archlucid.lastOpenArchitectureId.v1", "architecture-identity-001");
    window.localStorage.setItem(
      OPERATOR_RECENT_VIEWS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        entries: [
          {
            href: "/architecture/architectures/architecture-identity-001",
            label: "Payments platform",
            kind: "architecture",
            architectureId: "architecture-identity-001",
            visitedAtUtc: "2026-01-02T10:00:00.000Z",
          },
        ],
      }),
    );

    const target = resolveContinueLastArchitectureIdentityTarget();

    expect(target).toEqual({
      architectureId: "architecture-identity-001",
      label: "Payments platform",
      href: "/architecture/architectures/architecture-identity-001",
      visitedAtUtc: "2026-01-02T10:00:00.000Z",
    });
  });

  it("returns null when no architecture id is cached", () => {
    expect(resolveContinueLastArchitectureIdentityTarget()).toBeNull();
  });
});
