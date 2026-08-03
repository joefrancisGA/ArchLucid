import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { REVIEWS_LIST_PATH } from "@/lib/architecture-routes";
import {
  artifactPreviewHref,
  runArtifactPreviewPath,
} from "@/lib/artifact-preview-href";
import { signedRecordArtifactPath } from "@/lib/signed-records-paths";

describe("artifactPreviewHref (TB-1822 / TB-1948)", () => {
  const manifestId = "manifest-1";
  const artifactId = "artifact-guid-1";
  const runId = "run-guid-1";

  it("uses run-scoped Preview under REVIEWS_LIST_PATH when runId is set", () => {
    expect(artifactPreviewHref(manifestId, artifactId, runId)).toBe(
      `${REVIEWS_LIST_PATH}/${encodeURIComponent(runId)}/artifacts/${encodeURIComponent(artifactId)}`,
    );
    expect(runArtifactPreviewPath(runId, artifactId)).toBe(
      artifactPreviewHref(manifestId, artifactId, runId),
    );
  });

  it("uses signedRecordArtifactPath for manifest-scoped Preview (TB-1948)", () => {
    expect(artifactPreviewHref(manifestId, artifactId)).toBe(
      signedRecordArtifactPath(manifestId, artifactId),
    );
    expect(artifactPreviewHref(manifestId, artifactId, "   ")).toBe(
      signedRecordArtifactPath(manifestId, artifactId),
    );
  });

  it("targets App Router pages that exist on disk", () => {
    const appRoot = join(process.cwd(), "src", "app", "(operator)");
    const rerPage = join(appRoot, "reviews", "[runId]", "artifacts", "[artifactId]", "page.tsx");
    const mamPage = join(
      appRoot,
      "signed-records",
      "[manifestId]",
      "artifacts",
      "[artifactId]",
      "page.tsx",
    );

    expect(existsSync(rerPage)).toBe(true);
    expect(existsSync(mamPage)).toBe(true);

    expect(artifactPreviewHref(manifestId, artifactId, runId)).toContain("/artifacts/");
    expect(artifactPreviewHref(manifestId, artifactId)).toBe(
      `/signed-records/${manifestId}/artifacts/${artifactId}`,
    );
  });
});
