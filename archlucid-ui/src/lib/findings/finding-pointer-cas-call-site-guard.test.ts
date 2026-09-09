import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { findFindingPointerCasCallSiteViolations } from "@/lib/findings/finding-pointer-cas-call-site-guard";

const UI_ROOT = join(process.cwd());

describe("finding-pointer CAS call-site ratchet (FP-12)", () => {
  it("requires expectedCurrentDispositionRowVersionBase64 at every production write call site", () => {
    expect(findFindingPointerCasCallSiteViolations(UI_ROOT)).toEqual([]);
  });
});
