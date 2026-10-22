import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { INHABIT_DISPOSITION_AMEND_MOUNTED_CONTROL_SURFACES } from "@/lib/inhabit/inhabit-disposition-amend-mounted-controls";

const SRC_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("inhabit disposition amend mounted controls (IH-039)", () => {
  it("amend or history markers exist on every inventoried success surface", () => {
    const offenders: string[] = [];

    for (const surface of INHABIT_DISPOSITION_AMEND_MOUNTED_CONTROL_SURFACES) {
      const absolutePath = path.join(SRC_ROOT, surface.sourceRoot);

      if (!existsSync(absolutePath)) {
        offenders.push(`${surface.sourceRoot}: missing file`);

        continue;
      }

      const content = readFileSync(absolutePath, "utf8");
      const hasMarker = surface.requiredSuccessMarkers.some((marker) => content.includes(marker));

      if (!hasMarker) {
        offenders.push(
          `${surface.sourceRoot}: missing marker (${surface.requiredSuccessMarkers.join(" | ")})`,
        );
      }
    }

    expect(offenders).toEqual([]);
  });
});
