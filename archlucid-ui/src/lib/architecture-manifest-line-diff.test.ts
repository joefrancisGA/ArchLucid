import { describe, expect, it } from "vitest";

import {
  buildArchitectureManifestUnifiedLines,
  splitDiffHunkLines,
} from "@/lib/architecture-manifest-line-diff";

describe("splitDiffHunkLines", () => {
  it("returns empty for empty hunk", () => {
    expect(splitDiffHunkLines("")).toEqual([]);
  });

  it("normalizes CRLF and drops only the trailing newline segment", () => {
    expect(splitDiffHunkLines("a\r\nb\n")).toEqual(["a", "b"]);
  });

  it("treats a lone newline as one empty line", () => {
    expect(splitDiffHunkLines("\n")).toEqual([""]);
  });
});

describe("buildArchitectureManifestUnifiedLines", () => {
  it("marks additions and removals", () => {
    const lines = buildArchitectureManifestUnifiedLines("foo\n", "bar\n");

    expect(lines.map((l) => `${l.prefix}${l.text}`)).toEqual(["-foo", "+bar"]);
  });

  it("keeps shared context as neutral lines", () => {
    const lines = buildArchitectureManifestUnifiedLines(
      JSON.stringify({ a: 1, b: 2 }, null, 2),
      JSON.stringify({ a: 1, b: 3 }, null, 2),
    );

    const added = lines.filter((l) => l.kind === "add").length;
    const removed = lines.filter((l) => l.kind === "remove").length;
    const equal = lines.filter((l) => l.kind === "equal").length;

    expect(added).toBeGreaterThan(0);
    expect(removed).toBeGreaterThan(0);
    expect(equal).toBeGreaterThan(0);
  });
});
