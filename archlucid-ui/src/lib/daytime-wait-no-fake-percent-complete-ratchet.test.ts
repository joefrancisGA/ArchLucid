import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  assertDaytimeWaitNoFakePercentComplete,
  DAYTIME_WAIT_NO_FAKE_PERCENT_COMPLETE_SCAN_ROOTS,
} from "@/lib/daytime-wait-no-fake-percent-complete-ratchet";

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

describe("daytime-wait no fake percentComplete ratchet (DW-009)", () => {
  it("rejects percentComplete property references", () => {
    expect(() => assertDaytimeWaitNoFakePercentComplete('percentComplete: 42')).toThrow(
      /percentComplete/,
    );
    expect(() => assertDaytimeWaitNoFakePercentComplete("named stages only")).not.toThrow();
  });

  it("runs and operations trees do not reference percentComplete", () => {
    for (const scanRoot of DAYTIME_WAIT_NO_FAKE_PERCENT_COMPLETE_SCAN_ROOTS) {
      const absoluteRoot = join(REPO_ROOT, scanRoot);

      if (!statSync(absoluteRoot).isDirectory()) {
        continue;
      }

      const files = collectTsFiles(absoluteRoot);

      for (const filePath of files) {
        const source = readFileSync(filePath, "utf8");
        expect(() => assertDaytimeWaitNoFakePercentComplete(source)).not.toThrow();
      }
    }
  });
});
