import { describe, expect, it } from "vitest";

import {
  filterHelpMarkdownHeadingGroups,
  flattenHelpMarkdownHeadingGroups,
  groupHelpMarkdownHeadings,
} from "@/lib/help/help-markdown-heading-groups";
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";

const SAMPLE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { id: "api-url", title: "API URL", level: 2 },
  { id: "global-json", title: "Global `--json`", level: 3 },
  { id: "commands", title: "Commands", level: 2 },
  { id: "archlucid-try", title: "archlucid try", level: 2 },
  { id: "flags", title: "Flags", level: 3 },
];

describe("groupHelpMarkdownHeadings", () => {
  it("nests h3 headings under the preceding h2 section", () => {
    expect(groupHelpMarkdownHeadings(SAMPLE_HEADINGS)).toEqual([
      {
        section: { id: "api-url", title: "API URL", level: 2 },
        children: [{ id: "global-json", title: "Global `--json`", level: 3 }],
      },
      {
        section: { id: "commands", title: "Commands", level: 2 },
        children: [],
      },
      {
        section: { id: "archlucid-try", title: "archlucid try", level: 2 },
        children: [{ id: "flags", title: "Flags", level: 3 }],
      },
    ]);
  });
});

describe("filterHelpMarkdownHeadingGroups", () => {
  const groups = groupHelpMarkdownHeadings(SAMPLE_HEADINGS);

  it("returns all groups when the query is empty", () => {
    const filtered = filterHelpMarkdownHeadingGroups(groups, "");

    expect(filtered.groups).toHaveLength(3);
    expect(filtered.matchCount).toBe(5);
  });

  it("matches child titles and keeps only matching children when the parent does not match", () => {
    const filtered = filterHelpMarkdownHeadingGroups(groups, "flags");

    expect(filtered.groups).toEqual([
      {
        section: { id: "archlucid-try", title: "archlucid try", level: 2 },
        children: [{ id: "flags", title: "Flags", level: 3 }],
      },
    ]);
    expect(filtered.matchCount).toBe(1);
  });
});

describe("flattenHelpMarkdownHeadingGroups", () => {
  it("preserves section order for scroll-spy anchors", () => {
    const groups = groupHelpMarkdownHeadings(SAMPLE_HEADINGS);

    expect(flattenHelpMarkdownHeadingGroups(groups).map((heading) => heading.id)).toEqual([
      "api-url",
      "global-json",
      "commands",
      "archlucid-try",
      "flags",
    ]);
  });
});
