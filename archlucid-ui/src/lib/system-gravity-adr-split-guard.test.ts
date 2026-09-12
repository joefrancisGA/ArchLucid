import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  SYSTEM_GRAVITY_ADR_0098_RELATIVE_PATH,
  SYSTEM_GRAVITY_ADR_SPLIT_RELATIVE_PATH,
} from "@/lib/system-gravity-adr-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("system-gravity ADR split guard (SG-002)", () => {
  it("split doc names 0077 locator, 0079 surface, and 0098 instrument", () => {
    const splitPath = join(REPO_ROOT, SYSTEM_GRAVITY_ADR_SPLIT_RELATIVE_PATH);

    expect(existsSync(splitPath), SYSTEM_GRAVITY_ADR_SPLIT_RELATIVE_PATH).toBe(true);

    const split = readFileSync(splitPath, "utf8");

    expect(split).toMatch(/0077/);
    expect(split).toMatch(/0079/);
    expect(split).toMatch(/0098/);
    expect(split).toMatch(/Locator/);
    expect(split).toMatch(/Instrument/);
    expect(split).toMatch(/not Monday morning/i);
  });

  it("points at ADR 0098 file", () => {
    const split = readFileSync(join(REPO_ROOT, SYSTEM_GRAVITY_ADR_SPLIT_RELATIVE_PATH), "utf8");

    expect(split).toContain(SYSTEM_GRAVITY_ADR_0098_RELATIVE_PATH.split("/").pop()!);
  });
});
