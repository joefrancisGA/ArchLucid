import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { artifactPreviewHref } from "@/lib/artifact-preview-href";
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

  it("does not keep a run-scoped RER App Router page (bookmark redirect removed)", () => {
    const appRoot = join(process.cwd(), "src", "app", "(operator)");
    const rerPage = join(
      appRoot,
      "architecture",
      "reviews",
      "[reviewId]",
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

    expect(existsSync(rerPage)).toBe(false);
    expect(existsSync(mamPage)).toBe(true);

    expect(artifactPreviewHref(manifestId, artifactId, runId)).toBe(
      `/governance/signed-records/${manifestId}/artifacts/${artifactId}`,
    );
  });
});
