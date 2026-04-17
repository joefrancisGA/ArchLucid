import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

describe("generate_pricing_json.py", () => {
  it("writes archlucid-ui/public/pricing.json with schemaVersion 1", () => {
    const script = path.join(repoRoot, "scripts", "ci", "generate_pricing_json.py");

    execSync(`python3 "${script}"`, { stdio: "inherit", cwd: repoRoot });

    const outPath = path.join(repoRoot, "archlucid-ui", "public", "pricing.json");
    const raw = fs.readFileSync(outPath, "utf-8");
    const doc = JSON.parse(raw) as { schemaVersion?: number; packages?: unknown[] };

    expect(doc.schemaVersion).toBe(1);
    expect(Array.isArray(doc.packages)).toBe(true);
    expect((doc.packages as unknown[]).length).toBeGreaterThan(0);
  });
});
