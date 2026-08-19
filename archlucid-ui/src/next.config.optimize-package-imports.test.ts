import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

const REQUIRED_OPTIMIZE_PACKAGE_IMPORTS = ["lucide-react", "recharts"] as const;

function readPackageJsonDependencyNames(): string[] {
  const packageJsonPath = join(process.cwd(), "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    dependencies?: Record<string, string>;
  };

  return Object.keys(packageJson.dependencies ?? {});
}

function readRadixUiDependencyNames(dependencyNames: readonly string[]): string[] {
  return dependencyNames.filter((name) => name.startsWith("@radix-ui/react-")).sort();
}

function buildExpectedOptimizePackageImports(dependencyNames: readonly string[]): string[] {
  const radixDependencies = readRadixUiDependencyNames(dependencyNames);

  return [...REQUIRED_OPTIMIZE_PACKAGE_IMPORTS, ...radixDependencies];
}

function readConfiguredOptimizePackageImports(): string[] {
  return nextConfig.experimental?.optimizePackageImports ?? [];
}

describe("next.config optimizePackageImports (TB-565)", () => {
  it("tree-shakes barrel-heavy icon, chart, and Radix packages", () => {
    const optimized = readConfiguredOptimizePackageImports();

    expect(optimized).toContain("lucide-react");
    expect(optimized).toContain("recharts");
  });

  it("includes every installed @radix-ui/react-* dependency", () => {
    const optimized = new Set(readConfiguredOptimizePackageImports());
    const radixDependencies = readRadixUiDependencyNames(readPackageJsonDependencyNames());

    expect(radixDependencies.length).toBeGreaterThan(0);

    for (const dependency of radixDependencies) {
      expect(optimized.has(dependency)).toBe(true);
    }
  });
});

describe("next.config optimizePackageImports drift guard (TB-865)", () => {
  it("matches the canonical allowlist derived from direct dependencies", () => {
    const dependencyNames = readPackageJsonDependencyNames();
    const expected = buildExpectedOptimizePackageImports(dependencyNames);
    const configured = readConfiguredOptimizePackageImports();

    expect([...configured].sort()).toEqual([...expected].sort());
  });

  it("lists only direct production dependencies", () => {
    const dependencyNames = new Set(readPackageJsonDependencyNames());

    for (const entry of readConfiguredOptimizePackageImports()) {
      expect(dependencyNames.has(entry)).toBe(true);
    }
  });

  it("does not contain duplicate allowlist entries", () => {
    const configured = readConfiguredOptimizePackageImports();

    expect(new Set(configured).size).toBe(configured.length);
  });
});
