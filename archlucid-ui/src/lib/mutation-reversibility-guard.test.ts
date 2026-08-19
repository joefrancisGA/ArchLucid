import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { MUTATION_REVERSIBILITY_GUARDED_CONFIRM_SURFACES } from "@/lib/mutation-reversibility-inventory";

const SRC_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("mutation-reversibility guard (TB-2148)", () => {
  it("guarded confirm surfaces reference MutationReversibilityNotice and registry ids", () => {
    const offenders: string[] = [];

    for (const surface of MUTATION_REVERSIBILITY_GUARDED_CONFIRM_SURFACES) {
      const absolutePath = path.join(SRC_ROOT, surface.sourceRoot);

      if (!existsSync(absolutePath)) {
        offenders.push(`${surface.sourceRoot}: missing file`);

        continue;
      }

      const content = readFileSync(absolutePath, "utf8");

      if (!content.includes("MutationReversibilityNotice") && !content.includes("reversibilityMutationId")) {
        offenders.push(`${surface.sourceRoot}: missing MutationReversibilityNotice or reversibilityMutationId`);
      }

      if (!content.includes(surface.mutationId)) {
        offenders.push(`${surface.sourceRoot}: missing mutation id ${surface.mutationId}`);
      }
    }

    const approvalsListPath = path.join(
      SRC_ROOT,
      "app/(operator)/governance/_sections/GovernanceWorkflowApprovalsList.tsx",
    );
    const approvalsContent = readFileSync(approvalsListPath, "utf8");

    if (!approvalsContent.includes("governance_workflow_reject")) {
      offenders.push("GovernanceWorkflowApprovalsList.tsx: missing governance_workflow_reject");
    }

    expect(offenders).toEqual([]);
  });
});
