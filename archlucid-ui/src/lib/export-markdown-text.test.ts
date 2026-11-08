import { describe, expect, it } from "vitest";

import { pushBulletLines } from "@/lib/export-markdown-text";

describe("export-markdown-text", () => {
  it("emits stored-empty copy for blank string list entries (P-09)", () => {
    const lines: string[] = [];

    pushBulletLines(lines, ["", "keep"]);

    expect(lines).toEqual(["- Entry was stored empty.", "- keep"]);
  });
});
