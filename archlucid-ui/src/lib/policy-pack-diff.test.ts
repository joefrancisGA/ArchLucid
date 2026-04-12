import { describe, expect, it } from "vitest";

import { diffPolicyPackContent, type PolicyPackDiffItem } from "./policy-pack-diff";

function paths(items: PolicyPackDiffItem[]): string[] {
  return items.map((i) => i.path);
}

describe("diffPolicyPackContent", () => {
  it("returns empty list for identical objects", () => {
    const left = JSON.stringify({ a: 1, b: { c: 2 } });
    const right = JSON.stringify({ a: 1, b: { c: 2 } });

    expect(diffPolicyPackContent(left, right)).toEqual([]);
  });

  it("detects added top-level key", () => {
    const items = diffPolicyPackContent("{}", '{"newKey":true}');

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      path: "newKey",
      changeType: "added",
    });
    expect(items[0].rightValue).toContain("true");
  });

  it("detects removed key", () => {
    const items = diffPolicyPackContent('{"gone":42}', "{}");

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      path: "gone",
      changeType: "removed",
    });
    expect(items[0].leftValue).toContain("42");
  });

  it("detects changed primitive", () => {
    const items = diffPolicyPackContent('{"x":"old"}', '{"x":"new"}');

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      path: "x",
      changeType: "changed",
    });
    expect(items[0].leftValue).toContain("old");
    expect(items[0].rightValue).toContain("new");
  });

  it("walks nested objects with dot paths", () => {
    const left = JSON.stringify({
      security: { encryption: { atRest: true } },
    });
    const right = JSON.stringify({
      security: { encryption: { atRest: false } },
    });
    const items = diffPolicyPackContent(left, right);

    expect(items).toHaveLength(1);
    expect(items[0].path).toBe("security.encryption.atRest");
    expect(items[0].changeType).toBe("changed");
  });

  it("diffs array indices with dot notation", () => {
    const items = diffPolicyPackContent("[1,2]", "[1,2,3]");

    expect(paths(items)).toContain("2");
    expect(items.find((i) => i.path === "2")?.changeType).toBe("added");
  });

  it("treats both empty objects as no diff", () => {
    expect(diffPolicyPackContent("{}", "{}")).toEqual([]);
  });

  it("sorts results by path", () => {
    const left = JSON.stringify({ z: 1, a: 1 });
    const right = JSON.stringify({ z: 2, a: 2, b: 3 });
    const items = diffPolicyPackContent(left, right);

    const sorted = [...items].sort((x, y) => x.path.localeCompare(y.path));
    expect(items.map((i) => i.path)).toEqual(sorted.map((i) => i.path));
  });

  it("throws on invalid JSON", () => {
    expect(() => diffPolicyPackContent("{not-json", "{}")).toThrow();
  });
});
