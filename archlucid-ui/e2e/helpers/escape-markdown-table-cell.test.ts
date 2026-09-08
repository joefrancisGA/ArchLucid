import { describe, expect, it } from "vitest";

import { escapeMarkdownTableCell } from "./escape-markdown-table-cell";

describe("escapeMarkdownTableCell", () => {
  it("escapes pipes, newlines, and backslashes for markdown tables", () => {
    expect(escapeMarkdownTableCell("a|b\nc\\d")).toBe("a\\|b c\\\\d");
  });

  it("returns empty string unchanged", () => {
    expect(escapeMarkdownTableCell("")).toBe("");
  });
});
