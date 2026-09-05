import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  listAmendableRegistryMutationIds,
  MUTATION_AMENDABLE_MOUNTED_CONTROL_SURFACES,
} from "@/lib/mutation-reversibility-mounted-controls";
import { getMutationReversibilityEntry } from "@/lib/mutation-reversibility-registry";

const SRC_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("mutation-reversibility mounted controls (LD-05)", () => {
  it("lists a mounted control surface for every amendable registry id", () => {
    const amendableIds = listAmendableRegistryMutationIds().sort();
    const coveredIds = [...new Set(MUTATION_AMENDABLE_MOUNTED_CONTROL_SURFACES.map((surface) => surface.mutationId))].sort();

    expect(coveredIds).toEqual(amendableIds);
  });

  it("does not mount record correction on permanent registry ids", () => {
    expect(getMutationReversibilityEntry("governance_policy_pack_publish").classification).toBe("permanent");

    const permanentSurfaces = MUTATION_AMENDABLE_MOUNTED_CONTROL_SURFACES.filter(
      (surface) => surface.mutationId === "governance_policy_pack_publish",
    );

    expect(permanentSurfaces).toEqual([]);
  });

  it("amendable success surfaces reference record-correction controls", () => {
    const offenders: string[] = [];

    for (const surface of MUTATION_AMENDABLE_MOUNTED_CONTROL_SURFACES) {
      const absolutePath = path.join(SRC_ROOT, surface.sourceRoot);

      if (!existsSync(absolutePath)) {
        offenders.push(`${surface.sourceRoot}: missing file`);

        continue;
      }

      const content = readFileSync(absolutePath, "utf8");
      const hasMarker = surface.requiredSuccessMarkers.some((marker) => content.includes(marker));

      if (!hasMarker) {
        offenders.push(
          `${surface.sourceRoot}: missing success marker (${surface.requiredSuccessMarkers.join(" | ")})`,
        );
      }

      if (!content.includes(surface.mutationId)) {
        offenders.push(`${surface.sourceRoot}: missing mutation id ${surface.mutationId}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
