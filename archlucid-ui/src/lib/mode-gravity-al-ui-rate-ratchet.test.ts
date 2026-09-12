import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  MODE_GRAVITY_AL_UI_RATE_ADR_CITATION,
  MODE_GRAVITY_AL_UI_RATE_COMMAND_RELATIVE_PATH,
  MODE_GRAVITY_AL_UI_RATE_WORKING_STANCE_MARKER,
} from "@/lib/mode-gravity-al-ui-rate-ratchet";

const REPO_ROOT = join(process.cwd(), "..");

describe("mode-gravity /al-ui-rate Working ratchet (MG-009)", () => {
  it("command brief cites Working instrument stance and ADR 0094", () => {
    const commandPath = join(REPO_ROOT, MODE_GRAVITY_AL_UI_RATE_COMMAND_RELATIVE_PATH);

    expect(existsSync(commandPath)).toBe(true);

    const source = readFileSync(commandPath, "utf8");

    expect(MODE_GRAVITY_AL_UI_RATE_WORKING_STANCE_MARKER).toBe("Working instrument");
    expect(source).toContain(MODE_GRAVITY_AL_UI_RATE_WORKING_STANCE_MARKER);
    expect(source).toContain(MODE_GRAVITY_AL_UI_RATE_ADR_CITATION);
  });
});
