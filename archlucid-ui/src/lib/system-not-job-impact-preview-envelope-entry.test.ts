import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  SYSTEM_NOT_JOB_IMPACT_PREVIEW_CHEAP_PATH_OWNER,
  SYSTEM_NOT_JOB_IMPACT_PREVIEW_ENVELOPE_ENTRY_DOC_ANCHOR,
  SYSTEM_NOT_JOB_IMPACT_PREVIEW_POLICY_ENVELOPE_BODY,
  SYSTEM_NOT_JOB_NESTED_IMPACT_PREVIEW_PAGE_SUBTITLE,
  architectureDeskCloneSketchHref,
} from "@/lib/system-not-job-impact-preview-envelope-entry";
import {
  architectureNestedImpactPreviewPath,
  parseArchitectureNestedImpactPreviewArchitectureId,
} from "@/lib/architecture/architecture-routes";

const REPO_ROOT = join(process.cwd(), "..");
const NESTED_CLIENT_PATH =
  "archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/impact-preview/ArchitectureNestedImpactPreviewPageClient.tsx";
const ENTRY_STRIP_PATH = "archlucid-ui/src/components/architecture/ImpactPreviewPolicyEnvelopeEntryStrip.tsx";

describe("system-not-job impact preview envelope entry (SN-007)", () => {
  it("defines policy envelope copy that forbids Career architecture what-if and production observation", () => {
    expect(SYSTEM_NOT_JOB_IMPACT_PREVIEW_POLICY_ENVELOPE_BODY).toMatch(/policy packs/i);
    expect(SYSTEM_NOT_JOB_IMPACT_PREVIEW_POLICY_ENVELOPE_BODY).toMatch(/not a Career architecture what-if/i);
    expect(SYSTEM_NOT_JOB_IMPACT_PREVIEW_POLICY_ENVELOPE_BODY).toMatch(/not production observation/i);
    expect(SYSTEM_NOT_JOB_NESTED_IMPACT_PREVIEW_PAGE_SUBTITLE).toMatch(/Policy cheap envelope/i);
  });

  it("anchors nested Working route and architecture desk clone sketch href", () => {
    const architectureId = "architecture-identity-001";

    expect(architectureNestedImpactPreviewPath(architectureId)).toBe(
      "/architecture/architectures/architecture-identity-001/impact-preview",
    );
    expect(
      parseArchitectureNestedImpactPreviewArchitectureId(
        "/architecture/architectures/architecture-identity-001/impact-preview",
      ),
    ).toBe(architectureId);
    expect(architectureDeskCloneSketchHref(architectureId)).toBe(
      "/architecture/architectures/architecture-identity-001",
    );
    expect(SYSTEM_NOT_JOB_IMPACT_PREVIEW_CHEAP_PATH_OWNER).toBe("SN-008");
  });

  it("mounts nested client with policy envelope entry strip module", () => {
    const nestedClient = readFileSync(join(REPO_ROOT, NESTED_CLIENT_PATH), "utf8");
    const entryStrip = readFileSync(join(REPO_ROOT, ENTRY_STRIP_PATH), "utf8");

    expect(nestedClient).toContain("nestedPolicyEnvelopeEntry");
    expect(nestedClient).toContain("architectureNestedImpactPreviewPath");
    expect(entryStrip).toContain("impact-preview-policy-envelope-entry");
    expect(entryStrip).toContain("SYSTEM_NOT_JOB_IMPACT_PREVIEW_ARCHITECTURE_SKETCH_HELPER");
    expect(existsSync(join(REPO_ROOT, NESTED_CLIENT_PATH))).toBe(true);
  });

  it("points cheap architecture sketch path at ADR 0092", () => {
    const adr = readFileSync(
      join(REPO_ROOT, SYSTEM_NOT_JOB_IMPACT_PREVIEW_ENVELOPE_ENTRY_DOC_ANCHOR),
      "utf8",
    );

    expect(adr).toMatch(/labeled what-if envelope/i);
    expect(adr).toContain("SN-008");
  });
});
