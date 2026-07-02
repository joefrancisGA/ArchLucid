import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

function readPackageJsonDependencyNames(): string[] {
  const packageJsonPath = join(process.cwd(), "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    dependencies?: Record<string, string>;
  };

  return Object.keys(packageJson.dependencies ?? {});
}

describe("next.config optimizePackageImports (TB-565)", () => {
  it("tree-shakes barrel-heavy icon, chart, and Radix packages", () => {
    const optimized = nextConfig.experimental?.optimizePackageImports ?? [];

    expect(optimized).toContain("lucide-react");
    expect(optimized).toContain("recharts");
  });

  it("includes every installed @radix-ui/react-* dependency", () => {
    const optimized = new Set(nextConfig.experimental?.optimizePackageImports ?? []);
    const radixDependencies = readPackageJsonDependencyNames().filter((name) => name.startsWith("@radix-ui/react-"));

    expect(radixDependencies.length).toBeGreaterThan(0);

    for (const dependency of radixDependencies) {
      expect(optimized.has(dependency)).toBe(true);
    }
  });
});
