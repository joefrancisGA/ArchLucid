import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const operatorAppDir = dirname(fileURLToPath(import.meta.url));

const layoutSource = readFileSync(join(operatorAppDir, "layout.tsx"), "utf8");
const layoutClientSource = readFileSync(join(operatorAppDir, "OperatorLayoutClient.tsx"), "utf8");
const deferredSource = readFileSync(join(operatorAppDir, "operator-layout-deferred-chunks.tsx"), "utf8");
const manifestLoaderSource = readFileSync(
  join(operatorAppDir, "../../lib/operator/load-deferred-chunk-from-manifest.tsx"),
  "utf8",
);

describe("operator layout deferred imports", () => {
  it("keeps AppShellClient off the operator layout static import graph", () => {
    expect(layoutSource).not.toContain('@/components/AppShellClient"');
    expect(layoutSource).toContain("OperatorLayoutClient");
    expect(layoutClientSource).toContain("operator-layout-deferred-chunks");
    expect(layoutClientSource).toContain("AppShellClientDeferred");
    expect(layoutClientSource).not.toContain("next/dynamic");
    expect(layoutClientSource).not.toContain("deferredChunkLoader");
    expect(layoutClientSource).not.toContain('import("@/components/AppShellClient")');
  });

  it("dynamic-imports AppShellClient via manifest loaders", () => {
    expect(deferredSource).toContain("createDeferredComponentFromManifest");
    expect(deferredSource).toContain("app-shell-client");
    expect(manifestLoaderSource).toContain('import("@/components/AppShellClient")');
  });
});
