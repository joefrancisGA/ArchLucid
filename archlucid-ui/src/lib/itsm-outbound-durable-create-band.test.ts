import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  AZURE_OPENAI_CONNECTION_ENDPOINT,
  AZURE_OPENAI_CONNECTION_PROBE_ENDPOINT,
} from "@/lib/api/azure-openai-connection-api";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const ITSM_OUTBOUND_DURABLE_CREATE_BAND_TEST_FILES = [
  "src/lib/api/itsm-outbound-create.ts",
  "src/components/itsm/ItsmOutboundCreateIssueDialog.test.tsx",
  "src/components/itsm/ItsmOutboundCreateIssueDialog.tsx",
] as const;

describe("itsm outbound durable create band regression (TB-394)", () => {
  it("keeps sibling Vitest guards for durable async outbound create on disk", () => {
    for (const relativePath of ITSM_OUTBOUND_DURABLE_CREATE_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });
});
