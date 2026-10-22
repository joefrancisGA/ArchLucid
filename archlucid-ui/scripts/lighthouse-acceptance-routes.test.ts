import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

type LighthouseAcceptanceRoutesManifest = {
  readonly schemaVersion: number;
  readonly publicRoutes: readonly string[];
  readonly authenticatedRoutes: readonly string[];
};

const manifestPath = join(process.cwd(), "performance", "lighthouse-acceptance-routes.v1.json");

function readManifest(): LighthouseAcceptanceRoutesManifest {
  return JSON.parse(readFileSync(manifestPath, "utf8")) as LighthouseAcceptanceRoutesManifest;
}

describe("lighthouse-acceptance-routes manifest (GTM M-99)", () => {
  it("lists public marketing + optional authenticated founder routes", () => {
    const manifest = readManifest();

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.publicRoutes).toContain("/welcome");
    expect(manifest.publicRoutes).toContain("/showcase/customer-intake-modernization");
    expect(manifest.publicRoutes).toContain("/showcase/claims-intake-modernization");
    expect(manifest.publicRoutes).toContain("/help");
    expect(manifest.authenticatedRoutes).toContain("/architecture/reviews");
    expect(manifest.authenticatedRoutes).toContain("/settings/tenant");
    expect(manifest.publicRoutes.every((route) => route.startsWith("/"))).toBe(true);
    expect(manifest.authenticatedRoutes.every((route) => route.startsWith("/") || route === "/")).toBe(
      true,
    );
  });
});
