import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { findSurfaceMarkerViolations } from "@/lib/error-recovery-contract-guard";
import {
  LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_COUNT_BASELINE,
  LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_DOCUMENTED_EXCEPTIONS,
  LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_SURFACES,
  LIVELIHOOD_DOCUMENT_GUARD_MONITORED_ARCHITECTURE_REVIEW_DIRTY_FORM_PATHS,
  LIVELIHOOD_DOCUMENT_GUARD_PRIMITIVE_SURFACES,
  LIVELIHOOD_DOCUMENT_GUARD_SURFACES,
} from "@/lib/livelihood-document-guard-inventory";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

const EXCLUDED_FILE_SUFFIXES = [".test.ts", ".test.tsx", ".generated.ts", ".generated.tsx"] as const;

const ARCHITECTURE_REVIEW_SCAN_PREFIXES = [
  "app/(operator)/architecture/",
  "app/(operator)/governance/",
  "app/(operator)/insights/",
  "components/findings/",
  "components/governance/",
] as const;

const DIRTY_FORM_MARKERS = [
  "hasUnsaved",
  "formDirty",
  "unsavedChanges",
  "onDirtyChange",
  "hasUnsavedEdits",
  "hasUnsavedConnectionEdits",
  "hasUnsavedSettingsEdits",
  "hasUnsavedSamlEdits",
  "hasUnsavedRenewEdits",
  "teamsIntegrationHasUnsavedEdits",
  "riskExceptionRenewHasUnsavedEdits",
] as const;

const GUARD_MARKERS = [
  "useLivelihoodDocumentGuards",
  "useUnsavedChangesGuard",
] as const;

export type LivelihoodDocumentGuardViolation = {
  readonly relativePath: string;
  readonly message: string;
};

function shouldExcludeFile(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/");

  for (const suffix of EXCLUDED_FILE_SUFFIXES) {
    if (normalized.endsWith(suffix)) {
      return true;
    }
  }

  if (normalized.endsWith("-unsaved.ts")) {
    return true;
  }

  return false;
}

function normalizeRelativePath(relativePath: string): string {
  return relativePath.replace(/\\/g, "/").replace(/\/{2,}/g, "/");
}

function walkSourceFiles(rootDir: string, relativeDir: string, results: string[]): void {
  const normalizedDir = normalizeRelativePath(relativeDir).replace(/\/$/, "");
  const absoluteDir = join(rootDir, normalizedDir);

  let entries;

  try {
    entries = readdirSync(absoluteDir);
  }
  catch {
    return;
  }

  for (const entry of entries) {
    const relativePath = normalizeRelativePath(
      normalizedDir.length > 0 ? `${normalizedDir}/${entry}` : entry,
    );
    const absolutePath = join(rootDir, relativePath);

    let stat;

    try {
      stat = statSync(absolutePath);
    }
    catch {
      continue;
    }

    if (stat.isDirectory()) {
      walkSourceFiles(rootDir, relativePath, results);
      continue;
    }

    const extension = entry.includes(".") ? entry.slice(entry.lastIndexOf(".")) : "";

    if (!SOURCE_EXTENSIONS.has(extension) || shouldExcludeFile(relativePath)) {
      continue;
    }

    results.push(relativePath);
  }
}

function fileContainsAnyMarker(source: string, markers: readonly string[]): boolean {
  return markers.some((marker) => source.includes(marker));
}

function inventorySourceRoots(): Set<string> {
  const roots = new Set<string>();

  for (const surface of LIVELIHOOD_DOCUMENT_GUARD_SURFACES) {
    for (const root of surface.sourceRoots) {
      roots.add(root.replace(/\\/g, "/"));
    }
  }

  for (const surface of LIVELIHOOD_DOCUMENT_GUARD_PRIMITIVE_SURFACES) {
    for (const root of surface.sourceRoots) {
      roots.add(root.replace(/\\/g, "/"));
    }
  }

  for (const surface of LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_SURFACES) {
    for (const root of surface.sourceRoots) {
      roots.add(root.replace(/\\/g, "/"));
    }
  }

  return roots;
}

function isCoveredByInventory(relativePath: string, roots: Set<string>): boolean {
  const normalized = relativePath.replace(/\\/g, "/");

  for (const root of roots) {
    if (normalized === root || normalized.endsWith(`/${root}`)) {
      return true;
    }
  }

  return false;
}

export function discoverLivelihoodDirtyFormPathsInArchitectureReviewRoots(uiRoot: string): string[] {
  const srcRoot = join(uiRoot, "src");
  const discovered: string[] = [];

  for (const prefix of ARCHITECTURE_REVIEW_SCAN_PREFIXES) {
    walkSourceFiles(srcRoot, prefix, discovered);
  }

  const inventoryRoots = inventorySourceRoots();

  return discovered
    .filter((relativePath) => {
      const source = readFileSync(join(srcRoot, relativePath), "utf8");

      if (!fileContainsAnyMarker(source, DIRTY_FORM_MARKERS)) {
        return false;
      }

      if (fileContainsAnyMarker(source, GUARD_MARKERS)) {
        return false;
      }

      if (isCoveredByInventory(relativePath, inventoryRoots)) {
        return false;
      }

      return source.includes('"use client"') || source.includes("'use client'");
    })
    .sort((left, right) => left.localeCompare(right));
}

export function findLivelihoodDocumentGuardInventoryViolations(uiRoot: string): LivelihoodDocumentGuardViolation[] {
  const markerViolations = findSurfaceMarkerViolations(uiRoot, LIVELIHOOD_DOCUMENT_GUARD_SURFACES).map(
    (violation) => ({
      relativePath: violation.surfaceId,
      message: violation.message,
    }),
  );

  const primitiveViolations = findSurfaceMarkerViolations(uiRoot, LIVELIHOOD_DOCUMENT_GUARD_PRIMITIVE_SURFACES).map(
    (violation) => ({
      relativePath: violation.surfaceId,
      message: violation.message,
    }),
  );

  const discovered = discoverLivelihoodDirtyFormPathsInArchitectureReviewRoots(uiRoot);
  const discoveryViolations = discovered.map((relativePath) => ({
    relativePath,
    message:
      "Dirty operator form in architecture/review scope without useLivelihoodDocumentGuards — wire a guard or add to LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_SURFACES with a reason.",
  }));

  const monitoredViolations: LivelihoodDocumentGuardViolation[] = [];
  const srcRoot = join(uiRoot, "src");

  for (const relativePath of LIVELIHOOD_DOCUMENT_GUARD_MONITORED_ARCHITECTURE_REVIEW_DIRTY_FORM_PATHS) {
    const normalized = relativePath.replace(/\\/g, "/");
    const absolutePath = join(srcRoot, normalized);
    let source = "";

    try {
      source = readFileSync(absolutePath, "utf8");
    }
    catch {
      monitoredViolations.push({
        relativePath: normalized,
        message: "Monitored dirty-form path missing on disk.",
      });
      continue;
    }

    const guarded = fileContainsAnyMarker(source, GUARD_MARKERS);
    const deferred = LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_SURFACES.some((surface) =>
      surface.sourceRoots.some((root) => normalized === root.replace(/\\/g, "/")),
    );
    const inventoried = LIVELIHOOD_DOCUMENT_GUARD_SURFACES.some((surface) =>
      surface.sourceRoots.some((root) => normalized === root.replace(/\\/g, "/")),
    );

    if (!guarded && !deferred && !inventoried) {
      monitoredViolations.push({
        relativePath: normalized,
        message:
          "Monitored dirty-form path must wire useLivelihoodDocumentGuards or be listed in guarded/deferred inventory.",
      });
    }
  }

  return [...markerViolations, ...primitiveViolations, ...discoveryViolations, ...monitoredViolations];
}

export function findLivelihoodDocumentGuardDeferredShrinkViolations(): LivelihoodDocumentGuardViolation[] {
  const violations: LivelihoodDocumentGuardViolation[] = [];
  const deferredCount = LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_SURFACES.length;
  const maxAllowed =
    LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_COUNT_BASELINE
    + LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_DOCUMENTED_EXCEPTIONS.length;

  if (deferredCount > maxAllowed) {
    violations.push({
      relativePath: "LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_SURFACES",
      message:
        `Deferred livelihood guard inventory grew to ${deferredCount} rows (baseline ${LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_COUNT_BASELINE}) — wire a guard, shrink the list, or add a documented exception id to LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_DOCUMENTED_EXCEPTIONS.`,
    });
  }

  for (const exceptionId of LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_DOCUMENTED_EXCEPTIONS) {
    const exists = LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_SURFACES.some((surface) => surface.id === exceptionId);

    if (!exists) {
      violations.push({
        relativePath: exceptionId,
        message:
          "Documented deferred exception id is missing from LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_SURFACES.",
      });
    }
  }

  return violations;
}
