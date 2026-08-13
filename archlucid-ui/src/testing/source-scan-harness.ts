import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect } from "vitest";

import {
  resolveSourceScanTargetPath,
  type SourceScanTargetId,
} from "./source-scan-targets";

/** Reads UTF-8 source for a registered scan target (path lives in source-scan-targets.ts). */
export function readRegisteredSource(targetId: SourceScanTargetId): string {
  return readFileSync(resolveSourceScanTargetPath(targetId), "utf8");
}

/**
 * Reads a file next to the calling test module.
 * Prefer {@link readRegisteredSource} when multiple tests scan the same product file.
 */
export function readSiblingSource(importMetaUrl: string, relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(importMetaUrl)), relativePath), "utf8");
}

/** Reads a path under the archlucid-ui package root (Vitest cwd). */
export function readPackageSource(relativeFromPackageRoot: string): string {
  return readFileSync(join(process.cwd(), relativeFromPackageRoot), "utf8");
}

/** Reads a path under archlucid-ui/src. */
export function readUiSrcSource(relativeFromSrc: string): string {
  return readFileSync(join(process.cwd(), "src", relativeFromSrc), "utf8");
}

/** Asserts source text contains a needle; failure message includes the target label. */
export function expectSourceContains(
  source: string,
  needle: string,
  label: string = "source",
): void {
  expect(source, `${label} should contain ${JSON.stringify(needle)}`).toContain(needle);
}

/** Asserts source text does not contain a needle. */
export function expectSourceNotContains(
  source: string,
  needle: string,
  label: string = "source",
): void {
  expect(source, `${label} should not contain ${JSON.stringify(needle)}`).not.toContain(needle);
}

/** Asserts source text matches a regex. */
export function expectSourceMatches(
  source: string,
  pattern: RegExp,
  label: string = "source",
): void {
  expect(source, `${label} should match ${pattern}`).toMatch(pattern);
}

/** Asserts source text does not match a regex. */
export function expectSourceNotMatches(
  source: string,
  pattern: RegExp,
  label: string = "source",
): void {
  expect(source, `${label} should not match ${pattern}`).not.toMatch(pattern);
}

/**
 * Index of `needle` in `source`, failing clearly when missing.
 * Useful for order assertions without opaque `-1` comparisons.
 */
export function requireSourceIndex(
  source: string,
  needle: string,
  label: string = "source",
): number {
  const index = source.indexOf(needle);

  expect(index, `${label} should contain ${JSON.stringify(needle)}`).toBeGreaterThan(-1);

  return index;
}
