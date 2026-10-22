import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { EVIDENCE_INTAKE_HELP_SOURCE_DRIFT_ANCHORS } from "@/lib/evidence-intake-help-guide-content";
import {
  EVIDENCE_UPLOAD_ACCEPTED_EXTENSIONS,
  EVIDENCE_UPLOAD_ACCEPTED_FORMAT_ROWS,
} from "@/lib/evidence-upload-accepted-formats";

const REPO_ROOT = join(process.cwd(), "..");
const EVIDENCE_INTAKE_SOURCE_DOC = join(
  REPO_ROOT,
  "docs/library/customer-facing/EVIDENCE_INTAKE_OPERATOR_GUIDE.md",
);

describe("evidence-intake help drift guard", () => {
  const sourceDoc = readFileSync(EVIDENCE_INTAKE_SOURCE_DOC, "utf8");

  it("reads the registered evidence-intake help source document", () => {
    expect(sourceDoc).toContain("# Start a review");
  });

  it.each(EVIDENCE_INTAKE_HELP_SOURCE_DRIFT_ANCHORS.map((anchor) => [anchor.id, anchor.phrases] as const))(
    "keeps %s aligned with EVIDENCE_INTAKE_OPERATOR_GUIDE.md",
    (_id, phrases) => {
      for (const phrase of phrases) {
        expect(sourceDoc, `missing phrase "${phrase}"`).toContain(phrase);
      }
    },
  );

  it("lists every wizard extension in the help formats table", () => {
    expect(EVIDENCE_UPLOAD_ACCEPTED_FORMAT_ROWS.map((row) => row.extension)).toEqual([
      ...EVIDENCE_UPLOAD_ACCEPTED_EXTENSIONS,
    ]);
  });
});
