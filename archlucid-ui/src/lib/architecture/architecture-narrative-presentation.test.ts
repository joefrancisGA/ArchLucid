import { describe, expect, it, beforeEach } from "vitest";

import {
  countMarkdownH2Sections,
  looksLikeJsonPayload,
  normalizeEscapedNewlines,
  prepareArchitectureNarrativeForPresentation,
  resetArchitectureNarrativeRenderDiagnostic,
  shouldNormalizeEscapedNewlines,
  stripDangerousMarkupForPlainTextDisplay,
  unwrapOuterMarkdownCodeFence,
} from "@/lib/architecture/architecture-narrative-presentation";

describe("architecture-narrative-presentation", () => {
  beforeEach(() => {
    resetArchitectureNarrativeRenderDiagnostic();
  });

  it("normalizes escaped newlines when the payload is line-escaped", () => {
    const source = "## Executive summary\\n\\nGoverned claims intake.\\n\\n| Service | Role |\\n| --- | --- |\\n| API | Edge |";

    expect(shouldNormalizeEscapedNewlines(source)).toBe(true);

    const prepared = prepareArchitectureNarrativeForPresentation(source);

    expect(prepared.normalizationApplied).toContain("escaped-newlines");
    expect(prepared.markdown).toContain("## Executive summary");
    expect(prepared.markdown).toContain("| Service | Role |");
    expect(prepared.markdown).not.toContain("\\n");
  });

  it("unwraps an accidental outer markdown code fence", () => {
    const source = "```markdown\n## Scope\nPrivate networking only.\n```";
    const prepared = prepareArchitectureNarrativeForPresentation(source);

    expect(prepared.normalizationApplied).toContain("outer-code-fence");
    expect(prepared.markdown).toBe("## Scope\nPrivate networking only.");
  });

  it("detects JSON payloads for plain-text fallback", () => {
    expect(looksLikeJsonPayload('{"sections":["Executive summary"]}')).toBe(true);
    expect(looksLikeJsonPayload("## Executive summary\nBody")).toBe(false);
  });

  it("strips script tags for plain-text fallback", () => {
    const sanitized = stripDangerousMarkupForPlainTextDisplay(
      "Before<script>alert('xss')</script>After",
    );

    expect(sanitized).toBe("BeforeAfter");
  });

  it("strips style tags and inline event handlers for plain-text fallback", () => {
    expect(
      stripDangerousMarkupForPlainTextDisplay(
        "Before<style>body{color:red}</style>After",
      ),
    ).toBe("BeforeAfter");

    expect(
      stripDangerousMarkupForPlainTextDisplay(
        'Before<img src="x" onerror="alert(1)">After',
      ),
    ).toBe("BeforeAfter");
  });

  it("counts markdown h2 sections", () => {
    const markdown = "## One\n\nBody\n\n## Two\n\nMore";
    expect(countMarkdownH2Sections(markdown)).toBe(2);
  });

  it("leaves genuine code fences inside the document intact", () => {
    const source = "## Risks\n\n```powershell\nGet-AzContext\n```";
    const prepared = prepareArchitectureNarrativeForPresentation(source);

    expect(prepared.markdown).toContain("```powershell");
    expect(unwrapOuterMarkdownCodeFence(prepared.markdown)).toBe(prepared.markdown);
  });
});

describe("normalizeEscapedNewlines", () => {
  it("converts escaped sequences to real whitespace", () => {
    expect(normalizeEscapedNewlines("line one\\nline two\\tindented")).toBe("line one\nline two\tindented");
  });
});
