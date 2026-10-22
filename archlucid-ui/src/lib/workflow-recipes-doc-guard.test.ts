import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const WORKFLOW_RECIPES_PATH = "docs/library/customer-facing/WORKFLOW_RECIPES_BY_PERSONA.md";
const PILOTS_PATH_PATTERN = /\/v1\/pilots\//;

function readWorkflowRecipesMarkdown(): string {
  return readFileSync(join(process.cwd(), "..", WORKFLOW_RECIPES_PATH), "utf8");
}

function splitPrimaryStepsFromApiAlias(markdown: string): { primarySteps: string; apiAlias: string } {
  const aliasMarker = "<summary>API alias (backward compatibility)";
  const aliasIndex = markdown.indexOf(aliasMarker);

  if (aliasIndex < 0) {
    throw new Error(`Expected API alias subsection in ${WORKFLOW_RECIPES_PATH}`);
  }

  return {
    primarySteps: markdown.slice(0, aliasIndex),
    apiAlias: markdown.slice(aliasIndex),
  };
}

describe("workflow-recipes-doc-guard (TB-780)", () => {
  it("leads numbered steps with review vocabulary, not /v1/pilots/ paths", () => {
    const markdown = readWorkflowRecipesMarkdown();
    const { primarySteps, apiAlias } = splitPrimaryStepsFromApiAlias(markdown);

    expect(primarySteps).toMatch(/review export/i);
    expect(primarySteps).toMatch(/review exports/i);
    expect(primarySteps).not.toMatch(PILOTS_PATH_PATTERN);
    expect(apiAlias).toMatch(PILOTS_PATH_PATTERN);
    expect(apiAlias).toMatch(/first-value-report/);
    expect(apiAlias).toMatch(/pilot-run-deltas/);
  });
});
