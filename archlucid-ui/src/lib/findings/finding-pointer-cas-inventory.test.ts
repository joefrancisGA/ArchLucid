import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  FINDING_POINTER_CAS_BACKEND_SURFACES,
  FINDING_POINTER_CAS_DEFERRED_SURFACES,
  FINDING_POINTER_CAS_UI_SURFACES,
} from "@/lib/findings/finding-pointer-cas-inventory";

const UI_SRC_ROOT = join(process.cwd(), "src");
const REPO_ROOT = join(process.cwd(), "..");

const REQUIRED_UI_IDS = [
  "inspect-submit-disposition",
  "inspect-mark-remediated",
  "keyboard-apply",
  "keyboard-undo",
  "restore-button",
  "bulk-ui",
  "cluster-strip-bulk",
] as const;

const REQUIRED_BACKEND_IDS = ["sql-bulk", "service-bulk", "facade-bulk", "itsm-inbound"] as const;

describe("finding-pointer CAS inventory (FP-01)", () => {
  it("lists required UI and backend write paths whose source roots exist", () => {
    for (const id of REQUIRED_UI_IDS) {
      expect(FINDING_POINTER_CAS_UI_SURFACES.some((surface) => surface.id === id)).toBe(true);
    }

    for (const id of REQUIRED_BACKEND_IDS) {
      expect(FINDING_POINTER_CAS_BACKEND_SURFACES.some((surface) => surface.id === id)).toBe(true);
    }

    const keyboardApply = FINDING_POINTER_CAS_UI_SURFACES.find((surface) => surface.id === "keyboard-apply");
    const itsm = FINDING_POINTER_CAS_BACKEND_SURFACES.find((surface) => surface.id === "itsm-inbound");

    expect(keyboardApply?.status).toBe("done");
    expect(itsm?.status).toBe("done");
    expect(FINDING_POINTER_CAS_DEFERRED_SURFACES).toEqual([]);

    for (const surface of FINDING_POINTER_CAS_UI_SURFACES) {
      for (const relativePath of surface.sourceRoots) {
        expect(existsSync(join(UI_SRC_ROOT, relativePath)), relativePath).toBe(true);
      }
    }

    for (const surface of FINDING_POINTER_CAS_BACKEND_SURFACES) {
      for (const relativePath of surface.sourceRoots) {
        expect(existsSync(join(REPO_ROOT, relativePath)), relativePath).toBe(true);
      }
    }
  });
});
