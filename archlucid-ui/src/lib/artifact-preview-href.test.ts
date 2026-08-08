import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { REVIEWS_LIST_PATH } from "@/lib/architecture-routes";
import {
  artifactPreviewHref,
  runArtifactPreviewPath,
} from "@/lib/artifact-preview-href";
import { signedRecordArtifactPath } from "@/lib/signed-records-paths";

describe("artifactPreviewHref (TB-1821 / TB-1822 / TB-1948)", () => {
  const manifestId = "manifest-1";
  const artifactId = "artifact-guid-1";
  const runId = "run-guid-1";

  it("emits GAR Preview even when runId is set (product SoT)", () => {
    expect(artifactPreviewHref(manifestId, artifactId, runId)).toBe(
      signedRecordArtifactPath(manifestId, artifactId),
    );
    expect(artifactPreviewHref(manifestId, artifactId)).toBe(
      signedRecordArtifactPath(manifestId, artifactId),
    );
    expect(artifactPreviewHref(manifestId, artifactId, "   ")).toBe(
      signedRecordArtifactPath(manifestId, artifactId),
    );
  });

  it("keeps runArtifactPreviewPath for bookmark RER redirects only", () => {
    expect(runArtifactPreviewPath(runId, artifactId)).toBe(
      `${REVIEWS_LIST_PATH}/${encodeURIComponent(runId)}/artifacts/${encodeURIComponent(artifactId)}`,
    );
  });

  it("targets App Router pages that exist on disk", () => {
    const appRoot = join(process.cwd(), "src", "app", "(operator)");
    const rerPage = join(
      appRoot,
      "architecture",
      "reviews",
      "[runId]",
      "artifacts",
      "[artifactId]",
      "page.tsx",
    );
    const mamPage = join(
      appRoot,
      "governance",
      "signed-records",
      "[manifestId]",
      "artifacts",
      "[artifactId]",
      "page.tsx",
    );

    expect(existsSync(rerPage)).toBe(true);
    expect(existsSync(mamPage)).toBe(true);

    expect(artifactPreviewHref(manifestId, artifactId, runId)).toBe(
      `/governance/signed-records/${manifestId}/artifacts/${artifactId}`,
    );
  });
});
