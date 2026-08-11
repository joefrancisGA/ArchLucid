/**
 * TB-2092 — keep the evaluation "Sources for follow-up" heading off operator hub chrome.
 *
 * The heading itself is shared, so a grep for the literal cannot tell an approved surface from a new
 * one. Instead the registry in `evaluation-sources-title.ts` names every cleared surface, and these
 * tests hold the registry and the code in agreement: no second copy of the literal, no unregistered
 * surface rendering it, and no registry row outliving the surface it described.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import {
  EVALUATION_SOURCES_TITLE,
  EVALUATION_SOURCES_TITLE_SLUGS,
  EVALUATION_SOURCES_TITLE_SURFACES,
} from "@/lib/evaluation-sources-title";

const SRC_ROOT = join(process.cwd(), "src");

/** Sole module allowed to spell the heading out, and the composite that applies it as a default. */
const TITLE_DEFINITION_MODULE = "lib/evaluation-sources-title.ts";

const SHARED_STRIP_MODULE = "components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip.tsx";

const SCAN_SUFFIXES = [".ts", ".tsx"] as const;

/** Tests may assert the heading's absence, so only production sources are scanned. */
function isProductionSource(fileName: string): boolean {
  if (fileName.endsWith(".test.ts") || fileName.endsWith(".test.tsx")) {
    return false;
  }

  return SCAN_SUFFIXES.some((suffix) => fileName.endsWith(suffix));
}

function collectProductionSources(dir: string): string[] {
  const out: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") {
        continue;
      }

      out.push(...collectProductionSources(full));
      continue;
    }

    if (entry.isFile() && isProductionSource(entry.name)) {
      out.push(full);
    }
  }

  return out;
}

function toRelativePosix(absolutePath: string): string {
  return relative(SRC_ROOT, absolutePath).replace(/\\/g, "/");
}

/** `slug="…"` on a `EvidenceOrientationSourcesAndClaimStrip` usage. */
function readStripSlug(source: string): string | undefined {
  return /\bslug="([^"]+)"/.exec(source)?.[1];
}

function usesSharedEvaluationStrip(source: string): boolean {
  return source.includes("<EvidenceOrientationSourcesAndClaimStrip");
}

/** A surface that passes `sourcesTitle` has opted out of the evaluation heading. */
function overridesSourcesTitle(source: string): boolean {
  return source.includes("sourcesTitle=");
}

describe("TB-2092 evaluation Sources heading registry", () => {
  const productionSources: readonly string[] = collectProductionSources(SRC_ROOT);

  it("spells the heading out in exactly one module", () => {
    const modulesWithLiteral: string[] = productionSources
      .filter((absolutePath) => readFileSync(absolutePath, "utf8").includes(`"${EVALUATION_SOURCES_TITLE}"`))
      .map(toRelativePosix);

    expect(modulesWithLiteral).toEqual([TITLE_DEFINITION_MODULE]);
  });

  it("registers every surface that renders the heading through the shared strip", () => {
    const unregistered: string[] = [];

    for (const absolutePath of productionSources) {
      const source = readFileSync(absolutePath, "utf8");

      if (!usesSharedEvaluationStrip(source) || overridesSourcesTitle(source)) {
        continue;
      }

      const slug: string | undefined = readStripSlug(source);

      if (slug === undefined || !EVALUATION_SOURCES_TITLE_SLUGS.includes(slug)) {
        unregistered.push(`${toRelativePosix(absolutePath)} (slug: ${slug ?? "none"})`);
      }
    }

    expect(unregistered).toEqual([]);
  });

  it("registers every surface that references the heading constant directly", () => {
    const exempt: readonly string[] = [TITLE_DEFINITION_MODULE, SHARED_STRIP_MODULE];
    const registeredModules: readonly string[] = EVALUATION_SOURCES_TITLE_SURFACES.map((surface) => surface.module);

    const unregistered: string[] = productionSources
      .filter((absolutePath) => readFileSync(absolutePath, "utf8").includes("EVALUATION_SOURCES_TITLE"))
      .map(toRelativePosix)
      .filter((module) => !exempt.includes(module) && !registeredModules.includes(module));

    expect(unregistered).toEqual([]);
  });

  it("has no stale registry rows", () => {
    const stale: string[] = [];

    for (const surface of EVALUATION_SOURCES_TITLE_SURFACES) {
      const absolutePath: string = join(SRC_ROOT, surface.module);

      if (!existsSync(absolutePath)) {
        stale.push(`${surface.slug} (missing module ${surface.module})`);
        continue;
      }

      const source: string = readFileSync(absolutePath, "utf8");
      const rendersViaStrip: boolean = usesSharedEvaluationStrip(source) && !overridesSourcesTitle(source);
      const rendersViaConstant: boolean = source.includes("EVALUATION_SOURCES_TITLE");

      if (!rendersViaStrip && !rendersViaConstant) {
        stale.push(`${surface.slug} (${surface.module} no longer renders the heading)`);
      }
    }

    expect(stale).toEqual([]);
  });

  it("has no duplicate registry slugs", () => {
    expect([...new Set(EVALUATION_SOURCES_TITLE_SLUGS)]).toEqual([...EVALUATION_SOURCES_TITLE_SLUGS]);
  });

  it("has no operator EvidenceOrientationStrip / SourcesStrip modules on disk", () => {
    const leftovers: string[] = [];
    const operatorRoot = join(SRC_ROOT, "app", "(operator)");

    function walk(dir: string): void {
      let entries;
      try {
        entries = readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        const full = join(dir, entry.name);

        if (entry.isDirectory()) {
          walk(full);
          continue;
        }

        if (!entry.isFile()) {
          continue;
        }

        const name = entry.name;
        if (name.includes("CiteStrip")) {
          continue;
        }

        if (name.includes("EvidenceOrientationStrip") || name.includes("SourcesStrip")) {
          leftovers.push(relative(SRC_ROOT, full).replace(/\\/g, "/"));
        }
      }
    }

    if (existsSync(operatorRoot)) {
      walk(operatorRoot);
    }

    expect(leftovers).toEqual([]);
  });
});
