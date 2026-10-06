import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  parseAzureLabCliArguments,
  runAzureLabCli,
  writeAzureLabDemoPacks,
} from "./generate-azure-lab-inventory";

describe("generate Azure lab inventory CLI", () => {
  it("parses friendly scenario names and defaults output", () => {
    const options = parseAzureLabCliArguments(["--scenario", "landing-zone"]);

    expect(options.scenario).toBe("azure-lab-landing-zone");
    expect(options.outputPath).toContain("archlucid-lab-landing-zone.zip");
    expect(options.force).toBe(false);
  });

  it("writes all deterministic packs and protects existing files", () => {
    const outputDirectory = mkdtempSync(join(tmpdir(), "archlucid-azure-lab-"));

    try {
      const options = parseAzureLabCliArguments(["--scenario", "all", "--out", outputDirectory]);
      const firstPaths = writeAzureLabDemoPacks(options);
      const firstBytes = firstPaths.map((path) => readFileSync(path));

      expect(firstPaths).toHaveLength(3);
      expect(firstBytes.every((bytes) => bytes.length > 0)).toBe(true);
      expect(() => writeAzureLabDemoPacks(options)).toThrow("Refusing to overwrite");

      writeAzureLabDemoPacks({ ...options, force: true });
      expect(firstPaths.map((path) => readFileSync(path))).toEqual(firstBytes);
    } finally {
      rmSync(outputDirectory, { recursive: true, force: true });
    }
  });

  it("returns a nonzero result for invalid command lines", () => {
    expect(runAzureLabCli(["--scenario", "not-real"])).toBe(1);
  });
});
