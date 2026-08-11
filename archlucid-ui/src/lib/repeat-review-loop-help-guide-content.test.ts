import { describe, expect, it } from "vitest";

import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import {
  REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE,
  REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE_BUYER,
  repeatReviewLoopHelpPageSubtitle,
} from "@/lib/repeat-review-loop-help-guide-content";
import {
  REPEAT_REVIEW_LOOP_HELP_SOURCES,
  REPEAT_REVIEW_LOOP_HELP_WHERE_YOU_SEE_IT,
} from "@/lib/repeat-review-loop-help-evidence-copy";

const REPEAT_REVIEW_LOOP_SOURCE = "docs/library/REPEAT_REVIEW_LOOP.md";

function extractWhereYouSeeItCells(preparedMarkdown: string): string[] {
  const lines = preparedMarkdown.split("\n");
  const tableStart = lines.findIndex((line) => line.includes("| Where you see it |"));

  if (tableStart < 0) {
    return [];
  }

  const cells: string[] = [];

  for (let index = tableStart + 2; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? "";

    if (line.length === 0 || !line.startsWith("|")) {
      break;
    }

    const columns = line
      .split("|")
      .map((column) => column.trim())
      .filter((column) => column.length > 0);

    if (columns.length >= 2) {
      cells.push(columns[1] ?? "");
    }
  }

  return cells;
}

function extractMarkdownHref(cell: string): string | null {
  const match = /\]\(([^)]+)\)/.exec(cell);

  return match?.[1] ?? null;
}

describe("repeat-review-loop-help-guide-content", () => {
  it("uses shorter buyer subtitle", () => {
    expect(repeatReviewLoopHelpPageSubtitle(true)).toBe(REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE_BUYER);
    expect(repeatReviewLoopHelpPageSubtitle(false)).toBe(REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE);
    expect(REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE_BUYER.length).toBeLessThan(
      REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE.length,
    );
  });

  it("keeps operator help source hrefs off the internal namespace", () => {
    for (const source of REPEAT_REVIEW_LOOP_HELP_SOURCES) {
      expect(source.href.startsWith("/internal/"), `${source.label} targets ${source.href}`).toBe(false);
    }
  });

  it("maps every stickiness-table Where you see it row to a resolvable in-app href", () => {
    const loaded = tryLoadProductDocumentation("repeat-review-loop");

    if (loaded === null) {
      throw new Error("Expected repeat-review-loop documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, REPEAT_REVIEW_LOOP_SOURCE, {
      helpTopicSlug: loaded.entry.slug,
    });
    const whereYouSeeItCells = extractWhereYouSeeItCells(preparedMarkdown);

    expect(whereYouSeeItCells).toHaveLength(REPEAT_REVIEW_LOOP_HELP_WHERE_YOU_SEE_IT.length);

    for (const cell of whereYouSeeItCells) {
      const href = extractMarkdownHref(cell);

      expect(href, `missing link in cell: ${cell}`).not.toBeNull();
      expect(href?.startsWith("/internal/"), `internal href in cell: ${cell}`).toBe(false);
      expect(href).toMatch(/^\//);
    }
  });
});
