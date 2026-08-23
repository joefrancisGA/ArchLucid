import { describe, expect, it } from "vitest";

import { HELP_PAGE_LAYOUT, HELP_PAGE_TOC } from "@/lib/help/help-page-layout";

describe("help-page-layout", () => {
  it("defines section spacing for major headings", () => {
    expect(HELP_PAGE_LAYOUT.sectionH2).toContain("mt-10");
    expect(HELP_PAGE_LAYOUT.sectionH3).toContain("mt-7");
  });

  it("defines readable list and table rhythm", () => {
    expect(HELP_PAGE_LAYOUT.bulletList).toContain("my-4");
    expect(HELP_PAGE_LAYOUT.orderedList).toContain("my-4");
    expect(HELP_PAGE_LAYOUT.tableWrap).toContain("mb-6");
    expect(HELP_PAGE_LAYOUT.tableHeadCell).toContain("font-semibold");
  });

  it("left-aligns help content within the shell content pane", () => {
    expect(HELP_PAGE_LAYOUT.contentColumn).toContain("max-w-none");
    expect(HELP_PAGE_LAYOUT.contentGrid).toContain("gap-10");
    expect(HELP_PAGE_LAYOUT.contentGrid).toContain("max-w-[1200px]");
    expect(HELP_PAGE_LAYOUT.contentGrid).not.toContain("mx-auto");
    expect(HELP_PAGE_LAYOUT.contentGrid).not.toContain("52rem");
  });

  it("uses long-form reading typography for help body copy", () => {
    expect(HELP_PAGE_LAYOUT.readingBody).toContain("text-[15px]");
    expect(HELP_PAGE_LAYOUT.readingBody).toContain("leading-6");
    expect(HELP_PAGE_LAYOUT.paragraph).toContain("text-[15px]");
    expect(HELP_PAGE_LAYOUT.bulletList).toContain("text-[15px]");
  });

  it("styles the on-this-page heading with stronger hierarchy", () => {
    expect(HELP_PAGE_TOC.heading).toContain("font-semibold");
    expect(HELP_PAGE_TOC.heading).toContain("text-al-text-primary");
    expect(HELP_PAGE_TOC.heading).toContain("uppercase");
  });

  it("defines TOC link hover, focus, and active states", () => {
    expect(HELP_PAGE_TOC.link).toContain("hover:underline");
    expect(HELP_PAGE_TOC.link).toContain("focus-visible:outline");
    expect(HELP_PAGE_TOC.linkActive).toContain("font-semibold");
  });

  it("uses document scroll for typical TOC lists without nested list scrollbars", () => {
    expect(HELP_PAGE_TOC.list).not.toContain("overflow-y");
    expect(HELP_PAGE_TOC.list).not.toContain("max-h");
  });

  it("caps sticky TOC rail height at the viewport for unusually long topic lists", () => {
    expect(HELP_PAGE_TOC.nav).toContain("overflow-y-auto");
    expect(HELP_PAGE_TOC.nav).toContain("max-h-[calc");
  });

  it("defines a wider technical-reference grid and content column", () => {
    expect(HELP_PAGE_LAYOUT.technicalReferenceGrid).toContain("52rem");
    expect(HELP_PAGE_LAYOUT.technicalReferenceGrid).toContain("justify-start");
    expect(HELP_PAGE_LAYOUT.technicalReferenceColumn).toContain("lg:max-w-[52rem]");
    expect(HELP_PAGE_LAYOUT.technicalReferenceArticle).toContain("1200px");
  });
});
