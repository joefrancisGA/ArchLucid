import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

type LighthouseCiRoutesManifest = {
  readonly schemaVersion: number;
  readonly representativeRunId: string;
  readonly routes: readonly string[];
};

const manifestPath = join(process.cwd(), "performance", "lighthouse-ci-routes.v1.json");

function readManifest(): LighthouseCiRoutesManifest {
  return JSON.parse(readFileSync(manifestPath, "utf8")) as LighthouseCiRoutesManifest;
}

describe("lighthouse-ci-routes manifest (TB-693)", () => {
  it("tracks the four TB-693 key routes with the showcase run id fixture", () => {
    const manifest = readManifest();

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.representativeRunId).toBe(SHOWCASE_STATIC_DEMO_RUN_ID);
    expect(manifest.routes).toEqual([
      "/welcome",
      "/architecture/reviews",
      `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`,
      "/governance/findings",
    ]);
  });
});
