import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { signedRecordArtifactPath } from "@/lib/signed-records-paths";

describe("signed-record artifact preview route contract (TB-1947 / GAR)", () => {
  it("physical preview page loads descriptor model and page view", () => {
    const manifestId = "11111111-1111-4111-8111-111111111111";
    const artifactId = "cost-summary";

    expect(signedRecordArtifactPath(manifestId, artifactId)).toBe(
      `/governance/sealed-records/${manifestId}/artifacts/${artifactId}`,
    );

    const appRoot = join(process.cwd(), "src", "app", "(operator)");
    const mamPage = join(
      appRoot,
      "governance",
      "sealed-records",
      "[manifestId]",
      "artifacts",
      "[artifactId]",
      "page.tsx",
    );
    const loader = join(
      appRoot,
      "governance",
      "sealed-records",
      "[manifestId]",
      "artifacts",
      "[artifactId]",
      "_sections",
      "load-signed-record-artifact-page-model.ts",
    );
    const view = join(
      appRoot,
      "governance",
      "sealed-records",
      "[manifestId]",
      "artifacts",
      "[artifactId]",
      "_sections",
      "SignedRecordArtifactPageView.tsx",
    );

    expect(existsSync(mamPage)).toBe(true);
    expect(existsSync(loader)).toBe(true);
    expect(existsSync(view)).toBe(true);

    const source = readFileSync(mamPage, "utf8");

    expect(source).toContain("loadSignedRecordArtifactPageModel");
    expect(source).toContain("SignedRecordArtifactPageView");
    expect(source).toContain("isInvalidManifestRouteId");
    expect(source).toContain("isInvalidDynamicRouteToken");
  });
});
