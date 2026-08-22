import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const findingsDir = dirname(fileURLToPath(import.meta.url));

const pageSource = readFileSync(join(findingsDir, "page.tsx"), "utf8");
const assignedPageSource = readFileSync(join(findingsDir, "assigned-to-me/page.tsx"), "utf8");
const deferredSource = readFileSync(join(findingsDir, "governance-findings-deferred-chunks.tsx"), "utf8");
const manifestLoaderSource = readFileSync(
  join(findingsDir, "../../../../lib/operator/load-deferred-chunk-from-manifest.tsx"),
  "utf8",
);

describe("governance findings deferred imports (TB-2371)", () => {
  it("keeps GovernanceFindingsQueueClient off page static import graphs", () => {
    expect(pageSource).not.toContain("./GovernanceFindingsQueueClient");
    expect(assignedPageSource).not.toContain("../GovernanceFindingsQueueClient");
    expect(pageSource).toContain("GovernanceFindingsQueueClientDeferred");
    expect(assignedPageSource).toContain("GovernanceFindingsQueueClientDeferred");
    expect(pageSource).not.toContain("next/dynamic");
    expect(assignedPageSource).not.toContain("next/dynamic");
  });

  it("dynamic-imports findings queue via manifest loaders", () => {
    expect(deferredSource).toContain("createDeferredComponentFromManifest");
    expect(deferredSource).toContain("governance-findings-queue-client");
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/governance/findings/GovernanceFindingsQueueClient")',
    );
  });
});
