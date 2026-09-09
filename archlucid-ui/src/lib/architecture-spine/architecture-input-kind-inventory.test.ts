import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_INPUT_KIND_INVENTORY,
  architectureInputKindParticipatesInAuthorityAnalyzeToday,
} from "@/lib/architecture-spine/architecture-input-kind-inventory";
import { EVIDENCE_UPLOAD_ACCEPTED_EXTENSIONS } from "@/lib/evidence-upload-accepted-formats";

const REPO_ROOT = join(process.cwd(), "..");

const REQUIRED_ROW_IDS = [
  "markdown",
  "plain-text",
  "json",
  "yaml",
  "pdf",
  "docx",
  "png",
  "jpeg",
  "svg",
  "vsdx",
  "drawio",
  "mermaid",
  "terraform",
  "bicep",
] as const;

describe("architecture input kind inventory (AS-002)", () => {
  it("lists required kinds whose source roots exist and png/jpeg are not authority-analyze today", () => {
    for (const id of REQUIRED_ROW_IDS) {
      expect(ARCHITECTURE_INPUT_KIND_INVENTORY.some((row) => row.id === id), id).toBe(true);
    }

    for (const row of ARCHITECTURE_INPUT_KIND_INVENTORY) {
      for (const relativePath of row.sourceRoots) {
        expect(existsSync(join(REPO_ROOT, relativePath)), relativePath).toBe(true);
      }
    }

    const png = ARCHITECTURE_INPUT_KIND_INVENTORY.find((row) => row.id === "png");
    const jpeg = ARCHITECTURE_INPUT_KIND_INVENTORY.find((row) => row.id === "jpeg");

    expect(png?.droppedFromAuthority).toBe(true);
    expect(jpeg?.droppedFromAuthority).toBe(true);
    expect(png?.status).toBe("asOwned");
    expect(jpeg?.status).toBe("asOwned");
    expect(architectureInputKindParticipatesInAuthorityAnalyzeToday(png!)).toBe(false);
    expect(architectureInputKindParticipatesInAuthorityAnalyzeToday(jpeg!)).toBe(false);

    for (const extension of EVIDENCE_UPLOAD_ACCEPTED_EXTENSIONS) {
      const covered = ARCHITECTURE_INPUT_KIND_INVENTORY.some((row) =>
        row.extensions.includes(extension),
      );

      expect(covered, `wizard extension ${extension} must have an inventory row`).toBe(true);
    }
  });
});
