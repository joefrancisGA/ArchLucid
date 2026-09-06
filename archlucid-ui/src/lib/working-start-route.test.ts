import { describe, expect, it } from "vitest";

import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { resolveWorkingStartHref } from "@/lib/working-start-route";

describe("resolveWorkingStartHref (IS-03 / ADR 0069 / CA-33)", () => {
  it("prefers in-flight review over architecture and new", () => {
    const result = resolveWorkingStartHref({
      inFlightReviewId: "run-in-flight",
      lastOpenArchitectureId: "arch-identity-1",
    });

    expect(result.reason).toBe("in-flight-review");
    expect(result.href).toBe("/architecture/reviews/run-in-flight");
  });

  it("opens spawn-locked review instead of resuming a draft editor", () => {
    const result = resolveWorkingStartHref({
      lastOpenArchitectureId: "arch-identity-1",
      spawnLockedReviewId: "run-linked",
    });

    expect(result.reason).toBe("spawn-locked-review");
    expect(result.href).toBe("/architecture/reviews/run-linked");
  });

  it("opens last-open architecture identity desk when no review is active", () => {
    const result = resolveWorkingStartHref({
      lastOpenArchitectureId: "arch-identity-1",
    });

    expect(result.reason).toBe("last-open-architecture");
    expect(result.href).toBe("/architecture/architectures/arch-identity-1");
  });

  it("falls back to new architecture bootstrap when workspace is empty", () => {
    const result = resolveWorkingStartHref({});

    expect(result.reason).toBe("new-architecture");
    expect(result.href).toBe(ARCHITECTURES_NEW_PATH);
  });
});
