import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sectionsDir = dirname(fileURLToPath(import.meta.url));

function readSectionSource(fileName: string): string {
  return readFileSync(join(sectionsDir, fileName), "utf8");
}

describe("RunDetailBelowFoldSectionsDeferred", () => {
  it("keeps timelines-bundle on the server instead of a client dynamic chunk", () => {
    const wrapperSource = readSectionSource("RunDetailBelowFoldSectionsDeferred.tsx");
    const deferredChunksSource = readSectionSource("run-detail-page-view-deferred-chunks.tsx");
    const pageViewSource = readSectionSource("RunDetailPageView.tsx");
    const tabbedWorkspaceSource = readSectionSource("RunDetailTabbedWorkspace.tsx");

    expect(wrapperSource.trimStart().startsWith('"use client"')).toBe(false);
    expect(wrapperSource).not.toMatch(/from ["']next\/dynamic["']/);
    expect(wrapperSource).not.toContain("createDeferredComponentFromManifest");
    expect(wrapperSource).toContain("RunDetailBelowFoldSections");
    expect(deferredChunksSource).not.toContain('"run-detail-below-fold"');
    expect(deferredChunksSource).not.toContain("RunDetailBelowFoldSectionsDeferred");
    expect(pageViewSource).toContain('./RunDetailBelowFoldSectionsDeferred"');
    expect(tabbedWorkspaceSource).toContain('./RunDetailBelowFoldSectionsDeferred"');
    expect(pageViewSource).not.toContain('./RunDetailBelowFoldSections"');
    expect(tabbedWorkspaceSource).not.toContain('./RunDetailBelowFoldSections"');
  });
});
