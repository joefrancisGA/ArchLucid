import { describe, expect, it } from "vitest";

import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { resolveWorkingStartHref } from "@/lib/working-start-route";

describe("resolveWorkingStartHref (ADR 0077 / AO-15)", () => {
  it("opens last-open architecture identity desk when set", () => {
    const result = resolveWorkingStartHref({
      lastOpenArchitectureId: "arch-identity-1",
      inFlightParentArchitectureId: "arch-in-flight",
    });

    expect(result.reason).toBe("last-open-architecture");
    expect(result.href).toBe("/architecture/architectures/arch-identity-1");
  });

  it("opens in-flight parent architecture desk when last-open is empty", () => {
    const result = resolveWorkingStartHref({
      inFlightParentArchitectureId: "arch-in-flight",
    });

    expect(result.reason).toBe("in-flight-parent-architecture");
    expect(result.href).toBe("/architecture/architectures/arch-in-flight");
  });

  it("never returns a peer review URL for in-flight or spawn-locked session state", () => {
    const result = resolveWorkingStartHref({
      lastOpenArchitectureId: "arch-identity-1",
    });

    expect(result.href).not.toMatch(/^\/architecture\/reviews\/[^/]+$/);
  });

  it("AO-25: never opens the sealed-records gallery from Working Start", () => {
    const cases = [
      resolveWorkingStartHref({ lastOpenArchitectureId: "arch-identity-1" }),
      resolveWorkingStartHref({ inFlightParentArchitectureId: "arch-in-flight" }),
      resolveWorkingStartHref({}),
    ];

    for (const result of cases) {
      expect(result.href).not.toBe(SIGNED_RECORDS_LIST_PATH);
      expect(result.href).not.toMatch(/^\/governance\/sealed-records/);
    }
  });

  it("falls back to new architecture bootstrap when workspace is empty", () => {
    const result = resolveWorkingStartHref({});

    expect(result.reason).toBe("new-architecture");
    expect(result.href).toBe(ARCHITECTURES_NEW_PATH);
  });
});
