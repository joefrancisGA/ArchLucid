import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  assertDaytimeWaitNoForbiddenRunProgressUrl,
  DAYTIME_WAIT_NO_RUN_PROGRESS_URL_SCAN_ROOTS,
} from "@/lib/daytime-wait-no-run-progress-url-ratchet";

const REPO_ROOT = join(process.cwd(), "..");

function collectTsFiles(directory: string): string[] {
  const entries = readdirSync(directory);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
      continue;
    }

    if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("daytime-wait no run progress URL ratchet (DW-014)", () => {
  it("rejects forbidden progress URL fragments", () => {
    expect(() => assertDaytimeWaitNoForbiddenRunProgressUrl("/v1/runs/{runId}/progress")).toThrow(
      /Forbidden run progress URL/,
    );
    expect(() => assertDaytimeWaitNoForbiddenRunProgressUrl("/v1/runs/abc/progress")).toThrow(
      /Forbidden run progress URL/,
    );
    expect(() => assertDaytimeWaitNoForbiddenRunProgressUrl("/v1/operations/{operationId}")).not.toThrow();
  });

  it("api and operations lib trees do not reference run progress URLs", () => {
    for (const scanRoot of DAYTIME_WAIT_NO_RUN_PROGRESS_URL_SCAN_ROOTS) {
      const absoluteRoot = join(REPO_ROOT, scanRoot);
      const files = collectTsFiles(absoluteRoot);

      for (const filePath of files) {
        const source = readFileSync(filePath, "utf8");
        expect(() => assertDaytimeWaitNoForbiddenRunProgressUrl(source)).not.toThrow();
      }
    }
  });
});
