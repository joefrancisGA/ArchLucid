import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ACCELERATOR_GREENFIELD_PACK_ID } from "@/lib/accelerator-chooser-pack-prerequisite";
import {
  ACCELERATOR_CHOOSER_GRID_SURFACE_SOURCE_FILES,
  ACCELERATOR_CHOOSER_MARKDOWN_INVENTORY_SOURCE_PATH,
  listAcceleratorChooserEntryIds,
  listAcceleratorChooserGridRowIds,
  markdownSectionListsAcceleratorChooserPackId,
  sourceUsesAcceleratorChooserGridBuilder,
} from "@/lib/accelerator-chooser-entries-inventory";

function readRepoSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), "..", relativePath), "utf8");
}

function readUiSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function extractAcceleratorChooserMarkdownSection(markdown: string): string {
  const sectionStart = markdown.indexOf("## Accelerator chooser {#accelerator-chooser}");

  if (sectionStart < 0) {
    throw new Error("Expected accelerator chooser section in DEMO_QUICKSTART.md");
  }

  const nextSectionStart = markdown.indexOf("\n## ", sectionStart + 1);

  if (nextSectionStart < 0) {
    return markdown.slice(sectionStart);
  }

  return markdown.slice(sectionStart, nextSectionStart);
}

describe("accelerator-chooser entries inventory (TB-1607)", () => {
  it("keeps a unique pack id inventory with greenfield included for home and help", () => {
    const entryIds = listAcceleratorChooserEntryIds();

    expect(entryIds).toContain(ACCELERATOR_GREENFIELD_PACK_ID);
    expect(new Set(entryIds).size).toBe(entryIds.length);
    expect(entryIds.length).toBeGreaterThanOrEqual(7);
  });

  it("builds the same grid row ids for met and not-met prerequisite states", () => {
    const metRowIds = listAcceleratorChooserGridRowIds("met");
    const notMetRowIds = listAcceleratorChooserGridRowIds("not-met");

    expect(metRowIds).toHaveLength(5);
    expect(notMetRowIds).toHaveLength(5);
    expect(new Set(metRowIds).size).toBe(metRowIds.length);
    expect(notMetRowIds[0]).toBe(ACCELERATOR_GREENFIELD_PACK_ID);
    expect(new Set(metRowIds)).toEqual(new Set(notMetRowIds));
  });

  it("requires home and help specialty surfaces to use the shared grid builder", () => {
    for (const relativePath of ACCELERATOR_CHOOSER_GRID_SURFACE_SOURCE_FILES) {
      const source = readUiSource(relativePath);

      expect(sourceUsesAcceleratorChooserGridBuilder(source), relativePath).toBe(true);
    }
  });

  it("lists every TS pack id in the contributor accelerator chooser markdown table", () => {
    const markdown = readRepoSource(ACCELERATOR_CHOOSER_MARKDOWN_INVENTORY_SOURCE_PATH);
    const section = extractAcceleratorChooserMarkdownSection(markdown);

    for (const packId of listAcceleratorChooserEntryIds()) {
      expect(markdownSectionListsAcceleratorChooserPackId(section, packId), packId).toBe(true);
    }
  });
});
