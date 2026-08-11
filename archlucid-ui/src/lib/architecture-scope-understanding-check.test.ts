import { describe, expect, it } from "vitest";

import {
  deriveScopeUnderstandingBullets,
  mergeScopeBulletsIntoBrief,
  SCOPE_UNDERSTANDING_SECTION_HEADER,
} from "@/lib/architecture-scope-understanding-check";

describe("deriveScopeUnderstandingBullets", () => {
  it("renders bullets from fixture brief fields", () => {
    const bullets = deriveScopeUnderstandingBullets({
      architectureName: "Claims intake platform",
      businessOutcome: "Reduce manual claims routing by 30%",
      peopleAndSystems: [
        { label: "Claims adjuster", kind: "Human" },
        { label: "Policy API", kind: "Machine" },
      ],
    });

    expect(bullets.some((bullet) => bullet.text.includes("Claims intake platform"))).toBe(true);
    expect(bullets.some((bullet) => bullet.text.includes("Reduce manual claims routing"))).toBe(true);
    expect(bullets.some((bullet) => bullet.text.includes("Policy API"))).toBe(true);
  });

  it("marks derived bullets as inferred so callers can tell edited scope from untouched scope", () => {
    const bullets = deriveScopeUnderstandingBullets({
      systemName: "Payments hub",
      businessOutcome: "Improve settlement latency",
    });

    expect(bullets.every((bullet) => bullet.source === "inferred")).toBe(true);
  });
});

describe("mergeScopeBulletsIntoBrief", () => {
  it("appends confirmed scope bullets into the intake brief", () => {
    const bullets = deriveScopeUnderstandingBullets({
      systemName: "Payments hub",
      businessOutcome: "Improve settlement latency",
    });
    const merged = mergeScopeBulletsIntoBrief(bullets, "Base operator brief.");

    expect(merged).toContain("Base operator brief.");
    expect(merged).toContain(SCOPE_UNDERSTANDING_SECTION_HEADER);
    expect(merged).toContain("Payments hub");
  });
});
