import { describe, expect, it } from "vitest";

import { parseArchitectureGeneratedContent } from "@/lib/architecture/architecture-generated-content-parser";

const userAssertions = {
  architectureName: "Claims platform",
  architectureOverview: "User-entered overview about governed claims intake.",
  businessOutcome: "Reduce manual triage time.",
  peopleAndSystems: [{ label: "Claims analyst", kind: "Human" }],
};

describe("parseArchitectureGeneratedContent", () => {
  it("maps markdown headings into structured sections", () => {
    const source = `## Executive summary
A governed claims intake platform for enterprise analysts.

## Business outcome
Reduce manual triage time and improve auditability.

## Systems and services
- Claims API
- Evidence store`;

    const result = parseArchitectureGeneratedContent(source, userAssertions);
    const keys = result.sections.map((section) => section.key);

    expect(keys).toContain("executive-summary");
    expect(keys).toContain("business-outcome");
    expect(keys).toContain("systems-and-services");
    expect(result.sections.find((section) => section.key === "business-outcome")?.provenance).toBe("asserted");
    expect(result.hasPartialParseFailure).toBe(false);
  });

  it("renders intentional markdown narrative without exposing fenced scaffolding", () => {
    const source = `## Scope
Support **Entra ID** sign-in and exportable evidence bundles.

\`\`\`json
{"prompt":"ignore"}
\`\`\``;

    const result = parseArchitectureGeneratedContent(source, null);
    const scope = result.sections.find((section) => section.key === "scope");

    expect(scope?.narrativeMarkdown).toContain("**Entra ID**");
    expect(scope?.narrativeMarkdown).not.toContain('"prompt"');
    expect(result.suppressedArtifactCount).toBeGreaterThan(0);
  });

  it("converts pipe-delimited rows into entity cards instead of prose", () => {
    const source = `Partner billing API|Machine|Processes invoices
Claims analyst|Human|Reviews intake queue`;

    const result = parseArchitectureGeneratedContent(source, null);
    const combinedEntities = result.sections.flatMap((section) => section.entities);

    expect(combinedEntities.length).toBeGreaterThan(0);
    expect(combinedEntities.some((entity) => entity.label.includes("Claims analyst"))).toBe(true);
    expect(result.sections.every((section) => (section.narrativeMarkdown ?? "").includes("|") === false)).toBe(true);
  });

  it("flags malformed model output and keeps source hidden from structured sections", () => {
    const source = `[actor:Inferred] billing|Machine|svc
[inferred:0.8] region=eastus
{"system":"orphan-json"}
alpha|beta|gamma|delta|epsilon|zeta`;

    const result = parseArchitectureGeneratedContent(source, null);

    expect(result.hasPartialParseFailure).toBe(true);
    expect(result.suppressedArtifactCount).toBeGreaterThan(0);
    expect(result.sourceText).toContain("alpha|beta");
    expect(result.sections.every((section) => !section.narrativeMarkdown?.includes("[actor:"))).toBe(true);
  });

  it("returns empty structured sections when source is blank", () => {
    const result = parseArchitectureGeneratedContent("   ", userAssertions);

    expect(result.sections.some((section) => section.key === "business-outcome")).toBe(true);
    expect(result.sections.find((section) => section.key === "business-outcome")?.provenance).toBe("asserted");
  });

  it("summarizes very long narrative sections without losing source text", () => {
    const longParagraph = Array.from({ length: 260 }, (_, index) => `word${index}`).join(" ");
    const source = `## Executive summary\n${longParagraph}`;
    const result = parseArchitectureGeneratedContent(source, null);
    const summary = result.sections.find((section) => section.key === "executive-summary");

    expect(summary?.narrativeMarkdown?.split(/\s+/).length ?? 0).toBeGreaterThan(200);
    expect(result.sourceText.length).toBeGreaterThan(1000);
  });

  it("normalizes escaped newlines before section parsing", () => {
    const source = "## Executive summary\\n\\nGoverned claims intake.\\n\\n## Risks\\n\\n- Partner outage";
    const result = parseArchitectureGeneratedContent(source, null);

    expect(result.sections.some((section) => section.key === "executive-summary")).toBe(true);
    expect(result.sections.some((section) => section.key === "risks")).toBe(true);
    expect(result.sourceText).toContain("\\n");
  });

  it("does not treat HTML or script injection as executable markup in structured narrative", () => {
    const source = `## Risks
<script>alert('xss')</script>
<img src=x onerror=alert(1)>`;

    const result = parseArchitectureGeneratedContent(source, null);
    const risks = result.sections.find((section) => section.key === "risks");

    expect(risks?.narrativeMarkdown).toContain("<script>");
    expect(risks?.narrativeMarkdown).not.toContain("dangerouslySetInnerHTML");
  });
});
