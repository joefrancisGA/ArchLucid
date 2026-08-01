import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { signedRecordArtifactPath } from "@/lib/signed-records-paths";

describe("run artifact preview route contract (TB-1821 / RER)", () => {
  it("redirect page resolves run to canonical signed-record artifact URL", () => {
    const manifestId = "11111111-1111-4111-8111-111111111111";
    const artifactId = "cost-summary";
    const runId = "22222222-2222-4222-8222-222222222222";

    expect(signedRecordArtifactPath(manifestId, artifactId)).toBe(
      `/signed-records/${manifestId}/artifacts/${artifactId}`,
    );

    const rerPage = join(
      process.cwd(),
      "src",
      "app",
      "(operator)",
      "reviews",
      "[runId]",
      "artifacts",
      "[artifactId]",
      "page.tsx",
    );
    const source = readFileSync(rerPage, "utf8");

    expect(source).toContain("resolveGoldenManifestIdForRun");
    expect(source).toContain("permanentRedirect");
    expect(source).toContain("signedRecordArtifactPath");
    expect(source).not.toContain(runId);
  });
});
