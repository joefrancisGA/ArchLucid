import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  MODE_GRAVITY_FORBIDDEN_UI_FLAG_AS_MODE_FIELDS,
  MODE_GRAVITY_OPENAPI_SNAPSHOT_RELATIVE_PATH,
  MODE_GRAVITY_OPENAPI_STAMP_FIELDS,
} from "@/lib/mode-gravity-openapi-no-flag-as-mode";

const REPO_ROOT = join(process.cwd(), "..");

describe("mode-gravity OpenAPI no UI flag as Mode (MG-016)", () => {
  it("snapshot has run stamp fields and no buyerPolished execute Mode field", () => {
    const snapshot = readFileSync(join(REPO_ROOT, MODE_GRAVITY_OPENAPI_SNAPSHOT_RELATIVE_PATH), "utf8");

    for (const field of MODE_GRAVITY_OPENAPI_STAMP_FIELDS) {
      expect(snapshot).toContain(`"${field}"`);
    }

    for (const forbidden of MODE_GRAVITY_FORBIDDEN_UI_FLAG_AS_MODE_FIELDS) {
      expect(snapshot).not.toContain(`"${forbidden}"`);
    }
  });
});
