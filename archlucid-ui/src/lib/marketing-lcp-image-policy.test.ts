import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * TB-2032 waiver guard: marketing LCP is not image-bound today.
 * Fail if raster hero assets or raw `<img>` rasters appear without `next/image`.
 * Evidence: docs/architecture/tb2032_marketing_lcp_image_waiver.md
 */

const UI_ROOT = process.cwd();
const MARKETING_PUBLIC = join(UI_ROOT, "public", "marketing");
const MARKETING_APP = join(UI_ROOT, "src", "app", "(marketing)");
const MARKETING_COMPONENTS = join(UI_ROOT, "src", "components", "marketing");

const RAW_RASTER_IMG =
  /<img\b[^>]*\bsrc\s*=\s*["'][^"']*\.(png|jpe?g|webp|avif)(?:\?[^"']*)?["']/i;
/** In-page path refs that would put a marketing raster on the critical path. */
const MARKETING_RASTER_REF = /\/marketing\/[^"'`\s)]*\.(png|jpe?g|webp|avif)/i;

function collectFiles(dir: string, predicate: (name: string) => boolean): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath, predicate));
      continue;
    }

    if (entry.isFile() && predicate(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function collectSourceFiles(dir: string): string[] {
  return collectFiles(dir, (name) => name.endsWith(".ts") || name.endsWith(".tsx"));
}

describe("marketing LCP image policy (TB-2032 waiver)", () => {
  it("does not reference marketing raster paths from marketing UI source", () => {
    const sources = [...collectSourceFiles(MARKETING_APP), ...collectSourceFiles(MARKETING_COMPONENTS)];
    const offenders = sources.filter((filePath) => {
      try {
        return MARKETING_RASTER_REF.test(readFileSync(filePath, "utf8"));
      } catch {
        return false;
      }
    });

    expect(offenders).toEqual([]);
  });

  it("does not paint marketing first-viewport rasters via raw <img>", () => {
    const sources = [...collectSourceFiles(MARKETING_APP), ...collectSourceFiles(MARKETING_COMPONENTS)];
    const offenders = sources.filter((filePath) => {
      try {
        return RAW_RASTER_IMG.test(readFileSync(filePath, "utf8"));
      } catch {
        return false;
      }
    });

    expect(offenders).toEqual([]);
  });

  it("documents the waiver evidence note", () => {
    const evidencePath = join(
      UI_ROOT,
      "..",
      "docs",
      "architecture",
      "tb2032_marketing_lcp_image_waiver.md",
    );

    expect(existsSync(evidencePath)).toBe(true);

    const body = readFileSync(evidencePath, "utf8");

    expect(body).toContain("Waived");
    expect(body).toContain("Reopen criteria");
  });
});
