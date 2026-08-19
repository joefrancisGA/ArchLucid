import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("ExportTrackedAnchor (TB-512)", () => {
  it("uses neutral export wrapper naming and documents single first-export analytics scope", () => {
    const source = readFileSync(join(import.meta.dirname, "ExportTrackedAnchor.tsx"), "utf8");

    expect(source).toContain("export function ExportTrackedAnchor");
    expect(source).not.toMatch(/export function FunnelTelemetry/);
    expect(source).toMatch(/\/\*\*[\s\S]*single first-export lifecycle event[\s\S]*not persistent export surveillance[\s\S]*\*\//);
  });
});
