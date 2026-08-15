import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const operatorAppDir = dirname(fileURLToPath(import.meta.url));

const layoutSource = readFileSync(join(operatorAppDir, "layout.tsx"), "utf8");
const layoutClientSource = readFileSync(join(operatorAppDir, "OperatorLayoutClient.tsx"), "utf8");

describe("operator layout deferred imports", () => {
  it("keeps AppShellClient off the operator layout static import graph", () => {
    expect(layoutSource).not.toContain('@/components/AppShellClient"');
    expect(layoutSource).toContain("OperatorLayoutClient");
    expect(layoutClientSource).toContain("AppShellClientDeferred");
    expect(layoutClientSource).toContain("deferredChunkLoader");
    expect(layoutClientSource).toContain('import("@/components/AppShellClient")');
    expect(layoutClientSource).toContain("next/dynamic");
  });
});
