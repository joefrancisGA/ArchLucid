import { describe, expect, it } from "vitest";

import { findUnquotedMermaidCommentIndex } from "@/lib/mermaid/find-unquoted-mermaid-comment-index";

describe("findUnquotedMermaidCommentIndex", () => {
  it("returns -1 when the line has no comment marker", () => {
    expect(findUnquotedMermaidCommentIndex('    n1["app-hi-test-wus-001"]')).toBe(-1);
  });

  it("finds a trailing comment after a quoted label", () => {
    expect(findUnquotedMermaidCommentIndex('    n1["app-hi-test-wus-001"] %% al-type=microsoft')).toBe(
      '    n1["app-hi-test-wus-001"] '.length,
    );
  });

  it("ignores percent signs inside quoted labels", () => {
    expect(findUnquotedMermaidCommentIndex('    n1["rate%%off"]')).toBe(-1);
    expect(findUnquotedMermaidCommentIndex('    n1["rate%%off"] %% al-rg=rg-network')).toBe(
      '    n1["rate%%off"] '.length,
    );
  });

  it("finds a full-line comment at index 0 after indent is included", () => {
    expect(findUnquotedMermaidCommentIndex("    %% al-type=microsoft")).toBe(4);
  });
});
