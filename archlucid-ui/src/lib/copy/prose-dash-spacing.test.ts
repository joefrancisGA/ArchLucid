import { describe, expect, it } from "vitest";

import {
  PROSE_EM_DASH,
  hasTightProseEmDash,
  normalizeProseEmDashSpacing,
} from "@/lib/copy/prose-dash-spacing";
import {
  OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_BODY,
} from "@/lib/buyer-copy/operator-home";

describe("prose dash spacing", () => {
  it("defines a spaced em dash token", () => {
    expect(PROSE_EM_DASH).toBe(" — ");
  });

  it("inserts spaces around tight em dashes", () => {
    expect(normalizeProseEmDashSpacing("inventory—or review")).toBe("inventory — or review");
    expect(normalizeProseEmDashSpacing("already spaced — copy")).toBe("already spaced — copy");
    expect(normalizeProseEmDashSpacing("mapping—SOC 2")).toBe("mapping — SOC 2");
  });

  it("detects tight em dashes", () => {
    expect(hasTightProseEmDash("inventory—or")).toBe(true);
    expect(hasTightProseEmDash("inventory — or")).toBe(false);
  });

  it("keeps operator home lifecycle intro body spaced", () => {
    expect(hasTightProseEmDash(OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_BODY)).toBe(false);
    expect(OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_BODY).toContain("inventory — or");
  });
});
