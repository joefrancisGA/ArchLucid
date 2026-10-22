import { describe, expect, it } from "vitest";

import {
  AZURE_BOARDS_HELP_BANNED_VISIBLE_COPY_PATTERNS,
  AZURE_BOARDS_HELP_LIMITATIONS_HEADING,
  azureBoardsHelpCopyContainsBannedPattern,
} from "@/lib/azure-boards-help-limitations-honesty";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";

describe("azure-boards help limitations honesty (TB-1622)", () => {
  it("uses buyer-safe limitations heading in customer-facing source", () => {
    const loaded = tryLoadProductDocumentation("azure-boards");

    expect(loaded).not.toBeNull();

    if (loaded === null) {
      throw new Error("Expected azure-boards documentation.");
    }

    expect(loaded.markdown).toContain(`## ${AZURE_BOARDS_HELP_LIMITATIONS_HEADING}`);
    expect(azureBoardsHelpCopyContainsBannedPattern(loaded.markdown)).toHaveLength(0);
  });

  it("rewrites legacy Phase 1 limitations headings during presentation", () => {
    const source = [
      "## Known limitations (Phase 1)",
      "",
      "- No inbound status synchronization from Azure Boards to ArchLucid",
    ].join("\n");
    const prepared = prepareHelpMarkdownForPresentation(source, "docs/library/customer-facing/AZURE_BOARDS_INTEGRATION.md");

    expect(prepared).toContain(`## ${AZURE_BOARDS_HELP_LIMITATIONS_HEADING}`);
    expect(prepared).not.toMatch(/phase\s*1/i);
  });

  it("documents banned Azure Boards help customer patterns for reviewers", () => {
    expect(AZURE_BOARDS_HELP_BANNED_VISIBLE_COPY_PATTERNS.length).toBeGreaterThan(0);
    expect(azureBoardsHelpCopyContainsBannedPattern("Known limitations (Phase 1)")).toHaveLength(2);
    expect(azureBoardsHelpCopyContainsBannedPattern(AZURE_BOARDS_HELP_LIMITATIONS_HEADING)).toHaveLength(0);
  });
});
