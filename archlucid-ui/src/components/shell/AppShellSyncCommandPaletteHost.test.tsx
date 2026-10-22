import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("AppShellSyncCommandPaletteHost", () => {
  it("mounts from AppShellClient before deferred top bar chrome", () => {
    const appShellSource = readFileSync(join(process.cwd(), "src/components/AppShellClient.tsx"), "utf8");
    const hostSource = readFileSync(
      join(process.cwd(), "src/components/shell/AppShellSyncCommandPaletteHost.tsx"),
      "utf8",
    );
    const topBarSource = readFileSync(join(process.cwd(), "src/components/shell/OperatorShellTopBar.tsx"), "utf8");

    expect(appShellSource).toContain("AppShellSyncCommandPaletteHost");
    expect(hostSource).toContain("useCommandPaletteChunkPreload");
    expect(hostSource).toContain('showTrigger={false}');
    expect(topBarSource).not.toMatch(/<CommandPalette[\s/>]/);
  });
});
