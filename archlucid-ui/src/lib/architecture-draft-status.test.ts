import { describe, expect, it } from "vitest";

import { ARCHITECTURE_CREATION_BOOTSTRAP_INTENT } from "@/lib/architecture-creation-bootstrap";

import {
  architectureDraftDisplayName,
  customerFacingArchitectureDraftTitle,
  UNTITLED_ARCHITECTURE_LABEL,
} from "./architecture-draft-status";

describe("architectureDraftDisplayName", () => {
  it("prefers a non-empty system name", () => {
    expect(architectureDraftDisplayName("Claims intake", ARCHITECTURE_CREATION_BOOTSTRAP_INTENT)).toBe(
      "Claims intake",
    );
  });

  it("never surfaces the bootstrap intent marker", () => {
    expect(architectureDraftDisplayName(undefined, ARCHITECTURE_CREATION_BOOTSTRAP_INTENT)).toBe(
      UNTITLED_ARCHITECTURE_LABEL,
    );
    expect(architectureDraftDisplayName("", ARCHITECTURE_CREATION_BOOTSTRAP_INTENT)).toBe(
      UNTITLED_ARCHITECTURE_LABEL,
    );
  });

  it("uses a truncated free-text intent when the draft has a meaningful name", () => {
    const longIntent = "A".repeat(80);

    expect(architectureDraftDisplayName(undefined, longIntent)).toBe(`${"A".repeat(61)}…`);
  });

  it("falls back to Untitled architecture when intent is empty", () => {
    expect(architectureDraftDisplayName(undefined, "   ")).toBe(UNTITLED_ARCHITECTURE_LABEL);
  });
});

describe("customerFacingArchitectureDraftTitle", () => {
  it("replaces stored bootstrap marker titles", () => {
    const leaked = `${ARCHITECTURE_CREATION_BOOTSTRAP_INTENT.slice(0, 61)}…`;

    expect(customerFacingArchitectureDraftTitle(leaked)).toBe(UNTITLED_ARCHITECTURE_LABEL);
    expect(customerFacingArchitectureDraftTitle(ARCHITECTURE_CREATION_BOOTSTRAP_INTENT)).toBe(
      UNTITLED_ARCHITECTURE_LABEL,
    );
  });

  it("keeps meaningful stored titles", () => {
    expect(customerFacingArchitectureDraftTitle("Payments platform")).toBe("Payments platform");
  });
});
