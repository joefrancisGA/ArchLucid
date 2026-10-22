import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("playwright operator-mock default identity (LK-15)", () => {
  it("default test:e2e script uses operator-mock config, not buyer-polished mock", () => {
    const packageJsonPath = path.resolve(__dirname, "../package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.["test:e2e"]).toContain("playwright.operator-mock.config.ts");
    expect(packageJson.scripts?.["test:e2e"]).not.toContain("playwright.mock.config.ts");
  });

  it("operator-mock webServer env disables buyer-polished demo flags", () => {
    const configPath = path.resolve(__dirname, "../playwright.operator-mock.config.ts");
    const configSource = readFileSync(configPath, "utf8");

    expect(configSource).toContain('NEXT_PUBLIC_DEMO_MODE: "false"');
    expect(configSource).toContain('NEXT_PUBLIC_OPERATOR_EXPERIENCE: "operator"');
  });
});
