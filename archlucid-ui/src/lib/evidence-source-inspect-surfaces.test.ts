import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { EVIDENCE_SOURCE_INSPECT_SURFACES } from "@/lib/evidence-source-inspect-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("evidence-source-inspect surfaces inventory (ESI-01–ESI-06)", () => {
  it("lists catalog API, client API, preview policy, and help copy surfaces", () => {
    for (const relativePath of EVIDENCE_SOURCE_INSPECT_SURFACES) {
      expect(existsSync(join(REPO_ROOT, relativePath)), relativePath).toBe(true);
    }
  });
});
