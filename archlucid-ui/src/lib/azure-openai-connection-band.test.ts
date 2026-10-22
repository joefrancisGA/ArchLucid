import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  AZURE_OPENAI_CONNECTION_ENDPOINT,
  AZURE_OPENAI_CONNECTION_PROBE_ENDPOINT,
} from "@/lib/api/azure-openai-connection-api";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const AZURE_OPENAI_CONNECTION_BAND_TEST_FILES = [
  "src/lib/api/azure-openai-connection-api.ts",
  "src/app/(operator)/administration/model-governance/_sections/ModelGovernanceAzureOpenAiConnectionCard.tsx",
  "src/app/(operator)/administration/model-governance/_sections/ModelGovernanceSettingsCard.tsx",
] as const;

describe("azure openai byo connection band regression (TB-872)", () => {
  it("keeps sibling Vitest guards for BYO connection admin surfaces on disk", () => {
    for (const relativePath of AZURE_OPENAI_CONNECTION_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("tracks admin proxy endpoints for connection CRUD and probe", () => {
    expect(AZURE_OPENAI_CONNECTION_ENDPOINT).toBe("/api/proxy/v1/admin/settings/azure-openai-connection");
    expect(AZURE_OPENAI_CONNECTION_PROBE_ENDPOINT).toContain("/probe");
  });
});
