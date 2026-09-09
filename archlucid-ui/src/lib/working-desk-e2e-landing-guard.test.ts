import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const WORKING_DESK_LANDING_E2E_PATH = join(process.cwd(), "e2e/working-desk-landing.spec.ts");

describe("working desk E2E landing guard (SY-98)", () => {
  it("keeps a mock E2E spec that lands on the architecture portfolio first", () => {
    expect(existsSync(WORKING_DESK_LANDING_E2E_PATH), WORKING_DESK_LANDING_E2E_PATH).toBe(true);

    const source = readFileSync(WORKING_DESK_LANDING_E2E_PATH, "utf8");

    expect(source).toContain("/architecture/architectures");
    expect(source).not.toMatch(/goto\(['"]\/architecture\/reviews['"]\)/);
  });
});
