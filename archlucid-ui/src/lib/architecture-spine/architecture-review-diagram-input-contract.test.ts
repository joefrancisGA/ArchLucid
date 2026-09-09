import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT_RELATIVE_PATH,
  ARCHITECTURE_REVIEW_DIAGRAM_INPUT_FALSE_ANALYZED_CLAIMS,
  findArchitectureReviewDiagramInputHonestyViolations,
} from "@/lib/architecture-spine/architecture-review-diagram-input-honesty";
import {
  FORBIDDEN_CONTEXT_DOCUMENT_IMAGE_CONTENT_TYPE_PREFIX,
  SUPPORTED_CONTEXT_DOCUMENT_CONTENT_TYPES,
  STRUCTURED_DIAGRAM_CONTEXT_CONTENT_TYPE,
  isForbiddenContextDocumentImageContentType,
} from "@/lib/architecture-spine/supported-context-document-content-types";

const REPO_ROOT = join(process.cwd(), "..");

describe("architecture review diagram input contract (AS-003)", () => {
  it("contract file exists, forbids image/* context contentType, and lists structured diagram MIME", () => {
    const contractPath = join(REPO_ROOT, ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT_RELATIVE_PATH);

    expect(existsSync(contractPath), ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT_RELATIVE_PATH).toBe(true);

    const contract = readFileSync(contractPath, "utf8");

    expect(contract).toMatch(/ArchitectureDiagramModelRecord/i);
    expect(contract).toMatch(/IE-18/i);
    expect(contract).toMatch(/image\/\*/i);
    expect(contract).toMatch(/StructuredParse/i);
    expect(contract).toMatch(/VisionOptIn/i);
    expect(contract).toContain(STRUCTURED_DIAGRAM_CONTEXT_CONTENT_TYPE);
    expect(contract).toMatch(/attached PNG is analyzed/i);

    expect(isForbiddenContextDocumentImageContentType("image/png")).toBe(true);
    expect(isForbiddenContextDocumentImageContentType("image/jpeg")).toBe(true);
    expect(SUPPORTED_CONTEXT_DOCUMENT_CONTENT_TYPES).not.toContain(
      `${FORBIDDEN_CONTEXT_DOCUMENT_IMAGE_CONTENT_TYPE_PREFIX}png`,
    );
  });

  it("registers false analyzed-claim phrases for honesty CI", () => {
    expect(ARCHITECTURE_REVIEW_DIAGRAM_INPUT_FALSE_ANALYZED_CLAIMS.length).toBeGreaterThan(0);

    const sample = "When attached PNG is analyzed, engines see topology.";

    expect(findArchitectureReviewDiagramInputHonestyViolations(sample)).toContain(
      "attached PNG is analyzed",
    );
  });
});
