import { describe, expect, it } from "vitest";

import {
  deriveScopeUnderstandingBullets,
  mergeScopeBulletsIntoBrief,
  SCOPE_UNDERSTANDING_SECTION_HEADER,
  stripScopeUnderstandingSection,
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

  it("ignores a scope block already merged into the brief instead of restating it", () => {
    const merged = mergeScopeBulletsIntoBrief(
      deriveScopeUnderstandingBullets({ systemName: "Vertex", businessOutcome: "faster and better" }),
      "faster and better",
    );
    const bullets = deriveScopeUnderstandingBullets({
      systemName: "Vertex",
      businessOutcome: merged,
    });

    expect(bullets.some((bullet) => bullet.text.includes(SCOPE_UNDERSTANDING_SECTION_HEADER))).toBe(false);
    expect(bullets.some((bullet) => bullet.text === "Business outcome: faster and better")).toBe(true);
  });
});

describe("stripScopeUnderstandingSection", () => {
  it("removes a merged scope block and the blank line before it", () => {
    const merged = mergeScopeBulletsIntoBrief(
      deriveScopeUnderstandingBullets({ systemName: "Vertex" }),
      "Vertex tenant migration.",
    );

    expect(stripScopeUnderstandingSection(merged)).toBe("Vertex tenant migration.");
  });

  it("leaves briefs without a scope block untouched", () => {
    expect(stripScopeUnderstandingSection("Vertex tenant migration.")).toBe("Vertex tenant migration.");
  });

  it("treats missing text as empty", () => {
    expect(stripScopeUnderstandingSection(null)).toBe("");
    expect(stripScopeUnderstandingSection(undefined)).toBe("");
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
