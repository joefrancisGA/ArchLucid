import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sectionsDir = dirname(fileURLToPath(import.meta.url));

function readSectionSource(fileName: string): string {
  return readFileSync(join(sectionsDir, fileName), "utf8");
}

const deferredChunkFamilyFiles = [
  "run-detail-page-view-deferred-chunks.tsx",
  "run-detail-page-view-deferred-chunks-workspace.tsx",
  "run-detail-page-view-deferred-chunks-governance.tsx",
  "run-detail-page-view-deferred-chunks-evidence.tsx",
  "run-detail-page-view-deferred-chunks-review-package.ts",
  "run-detail-page-view-deferred-chunks-diagnostics.ts",
  "run-detail-page-view-deferred-chunks-compare.ts",
  "run-detail-page-view-deferred-chunks-modals.ts",
  "run-detail-page-view-deferred-chunks-architecture.ts",
] as const;

function readDeferredChunkFamilySource(): string {
  return deferredChunkFamilyFiles
    .map((fileName) => readSectionSource(fileName))
    .join("\n");
}

describe("RunDetailBelowFoldSectionsDeferred", () => {
  it("keeps timelines-bundle on the server instead of a client dynamic chunk", () => {
    const wrapperSource = readSectionSource("RunDetailBelowFoldSectionsDeferred.tsx");
    const deferredChunksSource = readDeferredChunkFamilySource();
    const pageViewCommittedSource = readSectionSource("RunDetailPageViewCommitted.tsx");
    const tabbedWorkspaceResolveSource = readSectionSource("resolve-run-detail-tabbed-workspace.tsx");

    expect(wrapperSource.trimStart().startsWith('"use client"')).toBe(false);
    expect(wrapperSource).not.toMatch(/from ["']next\/dynamic["']/);
    expect(wrapperSource).not.toContain("createDeferredComponentFromManifest");
    expect(wrapperSource).toContain("RunDetailBelowFoldSections");
    expect(deferredChunksSource).not.toContain('"run-detail-below-fold"');
    expect(deferredChunksSource).not.toContain("RunDetailBelowFoldSectionsDeferred");
    expect(pageViewCommittedSource).toContain('./RunDetailBelowFoldSectionsDeferred"');
    expect(tabbedWorkspaceResolveSource).toContain("RunDetailBelowFoldSectionsDeferred");
    expect(pageViewCommittedSource).not.toContain('./RunDetailBelowFoldSections"');
    expect(tabbedWorkspaceResolveSource).not.toContain('./RunDetailBelowFoldSections"');
  });
});
