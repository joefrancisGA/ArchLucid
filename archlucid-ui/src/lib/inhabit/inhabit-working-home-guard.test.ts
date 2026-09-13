import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  INHABIT_WORKING_HOME_UNFINISHED_WORK_HEADING,
  INHABIT_WORKING_HOME_UNFINISHED_WORK_CONTINUE_CTA,
} from "@/lib/inhabit/inhabit-working-home-copy";
import { INHABIT_WORKING_HOME_PIPELINE_ROWS } from "@/lib/inhabit-leak-inventories";

const SRC_ROOT = join(process.cwd(), "src");

describe("inhabit working home guard (IH-027)", () => {
  it("uses inhabit desk copy on Working unfinished-work rail", () => {
    const source = readFileSync(
      join(SRC_ROOT, "components/operator-home/UnfinishedWorkRail.tsx"),
      "utf8",
    );

    expect(source).toContain("INHABIT_WORKING_HOME_UNFINISHED_WORK_HEADING");
    expect(source).toContain("INHABIT_WORKING_HOME_UNFINISHED_WORK_CONTINUE_CTA");
    expect(source).toContain("workingMode: isWorkingMode");
    expect(INHABIT_WORKING_HOME_UNFINISHED_WORK_HEADING).not.toMatch(/finalize/i);
    expect(INHABIT_WORKING_HOME_UNFINISHED_WORK_CONTINUE_CTA).toBe("Open architecture");
  });

  it("marks unfinished-work rail as not teaching pipeline in IH-012 inventory", () => {
    const rail = INHABIT_WORKING_HOME_PIPELINE_ROWS.find((row) =>
      row.relativePath.includes("UnfinishedWorkRail"),
    );

    expect(rail?.teachesPipeline).toBe(false);
    expect(rail?.ownerPrompt).toBe("IH-027");
  });
});
