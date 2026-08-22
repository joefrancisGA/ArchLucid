import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const routeDir = dirname(fileURLToPath(import.meta.url));

const pageSource = readFileSync(join(routeDir, "page.tsx"), "utf8");
const assignedPageSource = readFileSync(join(routeDir, "assigned-to-me/page.tsx"), "utf8");
const deferredSource = readFileSync(join(routeDir, "governance-findings-deferred-chunks.tsx"), "utf8");
const manifestLoaderSource = readFileSync(
  join(routeDir, "../../../../lib/operator/load-deferred-chunk-from-manifest.tsx"),
  "utf8",
);

describe("governance findings deferred imports (TB-571 / wave 11)", () => {
  it("keeps GovernanceFindingsQueueClient off the page static import graph", () => {
    expect(pageSource).not.toContain('import GovernanceFindingsQueueClient from "./GovernanceFindingsQueueClient"');
    expect(pageSource).toContain("GovernanceFindingsQueueClientDeferred");
    expect(pageSource).not.toContain("next/dynamic");
    expect(assignedPageSource).toContain("GovernanceFindingsQueueClientDeferred");
  });

  it("dynamic-imports the findings queue client via manifest loaders", () => {
    expect(deferredSource).toContain("createDeferredComponentFromManifest");
    expect(deferredSource).not.toContain("next/dynamic");
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/governance/findings/GovernanceFindingsQueueClient")',
    );
    expect(deferredSource).toContain("governance-findings-queue-client");
  });
});
