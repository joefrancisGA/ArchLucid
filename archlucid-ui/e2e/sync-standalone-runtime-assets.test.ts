import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { syncStandaloneRuntimeAssets } from "./sync-standalone-runtime-assets";

describe("syncStandaloneRuntimeAssets", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("copies ACCESSIBILITY.md into standalone go-to-market-samples for live SSR", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "al-standalone-sync-"));
    tempRoots.push(repoRoot);
    const projectRoot = path.join(repoRoot, "archlucid-ui");
    const standaloneRoot = path.join(projectRoot, ".next", "standalone");

    fs.mkdirSync(path.join(projectRoot, ".next", "static"), { recursive: true });
    fs.mkdirSync(standaloneRoot, { recursive: true });
    fs.writeFileSync(path.join(standaloneRoot, "server.js"), "/* standalone */\n");
    fs.writeFileSync(path.join(projectRoot, ".next", "static", "chunk.js"), "/* static */\n");
    fs.writeFileSync(path.join(repoRoot, "ACCESSIBILITY.md"), "# Accessibility\nLast reviewed: 2026-01-01\n");
    fs.mkdirSync(path.join(repoRoot, "docs", "library"), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, "docs", "library", "help.md"), "# Help\n");

    const syncedRoot = syncStandaloneRuntimeAssets(projectRoot);

    expect(syncedRoot).toBe(standaloneRoot);
    expect(fs.existsSync(path.join(standaloneRoot, "go-to-market-samples", "ACCESSIBILITY.md"))).toBe(true);
    expect(fs.readFileSync(path.join(standaloneRoot, "go-to-market-samples", "ACCESSIBILITY.md"), "utf8")).toContain(
      "Last reviewed: 2026-01-01",
    );
    expect(fs.existsSync(path.join(standaloneRoot, "docs", "library", "help.md"))).toBe(true);
  });

  it("live and mock Playwright starters share the standalone asset sync helper", () => {
    const liveSrc = fs.readFileSync(path.resolve(__dirname, "start-e2e-live-api.ts"), "utf8");
    const mockSrc = fs.readFileSync(path.resolve(__dirname, "start-e2e-with-mock.ts"), "utf8");

    expect(liveSrc).toContain('from "./sync-standalone-runtime-assets"');
    expect(mockSrc).toContain('from "./sync-standalone-runtime-assets"');
    expect(liveSrc).not.toContain("function syncStandaloneRuntimeAssets");
    expect(mockSrc).not.toContain("function syncStandaloneRuntimeAssets");
  });
});
