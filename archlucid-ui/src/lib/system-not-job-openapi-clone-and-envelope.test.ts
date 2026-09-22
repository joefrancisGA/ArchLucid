import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  SYSTEM_NOT_JOB_BRANCH_ENVELOPE_OPENAPI_PATH,
  SYSTEM_NOT_JOB_CLONE_ENVELOPE_OPENAPI_SCHEMAS,
  SYSTEM_NOT_JOB_CLONE_SNAPSHOT_OPENAPI_PATH,
  SYSTEM_NOT_JOB_FORBIDDEN_CLONE_SNAPSHOT_REQUEST_BODY_FIELDS,
  SYSTEM_NOT_JOB_OPENAPI_CLONE_AND_ENVELOPE_NO_WIRE_CHANGE_LINE,
  SYSTEM_NOT_JOB_OPENAPI_CLONE_AND_ENVELOPE_OWNER,
  SYSTEM_NOT_JOB_OPENAPI_SNAPSHOT_RELATIVE_PATH,
} from "@/lib/system-not-job-openapi-clone-and-envelope";

const REPO_ROOT = join(process.cwd(), "..");

function readOpenApiSnapshot(): string {
  return readFileSync(join(REPO_ROOT, SYSTEM_NOT_JOB_OPENAPI_SNAPSHOT_RELATIVE_PATH), "utf8");
}

function extractOpenApiPathBlock(snapshot: string, path: string): string {
  const marker = `"${path}"`;
  const start = snapshot.indexOf(marker);

  expect(start, path).toBeGreaterThanOrEqual(0);

  const sliceStart = snapshot.lastIndexOf("\n", start);
  const nextPath = snapshot.indexOf('\n    "/v1/', start + marker.length);
  const sliceEnd = nextPath === -1 ? snapshot.length : nextPath;

  return snapshot.slice(sliceStart, sliceEnd);
}

describe("SN-035 OpenAPI clone and envelope spawn", () => {
  it("documents no wire change for SN-008 clone and SN-015 envelope paths", () => {
    expect(SYSTEM_NOT_JOB_OPENAPI_CLONE_AND_ENVELOPE_OWNER).toBe("SN-035");
    expect(SYSTEM_NOT_JOB_OPENAPI_CLONE_AND_ENVELOPE_NO_WIRE_CHANGE_LINE).toContain(
      "No OpenAPI snapshot regeneration",
    );
    expect(SYSTEM_NOT_JOB_OPENAPI_CLONE_AND_ENVELOPE_NO_WIRE_CHANGE_LINE).toContain("BranchDraftRequest");
    expect(existsSync(join(REPO_ROOT, SYSTEM_NOT_JOB_OPENAPI_SNAPSHOT_RELATIVE_PATH))).toBe(true);
  });

  it("openapi snapshot documents clone-snapshot without a request body", () => {
    const snapshot = readOpenApiSnapshot();
    const cloneBlock = extractOpenApiPathBlock(snapshot, SYSTEM_NOT_JOB_CLONE_SNAPSHOT_OPENAPI_PATH);

    expect(cloneBlock).toContain('"post"');
    expect(cloneBlock).toContain(SYSTEM_NOT_JOB_CLONE_ENVELOPE_OPENAPI_SCHEMAS.cloneSnapshotResponse);
    expect(cloneBlock).not.toContain('"requestBody"');

    const requestBodyStart = cloneBlock.indexOf('"requestBody"');

    expect(requestBodyStart).toBe(-1);

    for (const forbidden of SYSTEM_NOT_JOB_FORBIDDEN_CLONE_SNAPSHOT_REQUEST_BODY_FIELDS) {
      expect(cloneBlock).not.toContain(`"${forbidden}"`);
    }
  });

  it("openapi snapshot documents branch envelope with invariant override request schema", () => {
    const snapshot = readOpenApiSnapshot();
    const branchBlock = extractOpenApiPathBlock(snapshot, SYSTEM_NOT_JOB_BRANCH_ENVELOPE_OPENAPI_PATH);

    expect(branchBlock).toContain('"post"');
    expect(branchBlock).toContain('"requestBody"');
    expect(branchBlock).toContain(SYSTEM_NOT_JOB_CLONE_ENVELOPE_OPENAPI_SCHEMAS.branchRequest);
    expect(branchBlock).toContain(SYSTEM_NOT_JOB_CLONE_ENVELOPE_OPENAPI_SCHEMAS.branchResponse);
    expect(snapshot).toContain(SYSTEM_NOT_JOB_CLONE_ENVELOPE_OPENAPI_SCHEMAS.branchOverrideKind);
    expect(snapshot).toContain('"overrideKind"');
    expect(snapshot).toContain('"overrideValue"');
  });

  it("does not invent draft-to-draft compare API in openapi snapshot", () => {
    const snapshot = readOpenApiSnapshot().toLowerCase();

    expect(snapshot).not.toContain("draftcompare");
    expect(snapshot).not.toContain("compare-draft");
    expect(snapshot).not.toContain("leftdraftid");
    expect(snapshot).not.toContain("rightdraftid");
  });

  it("generated TS types and UI client align with clone and branch wire contracts", () => {
    const schemas = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/lib/api-types/schemas.generated.ts"),
      "utf8",
    );
    const paths = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/lib/api-types/paths.generated.ts"),
      "utf8",
    );
    const lifecycleApi = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/lib/api/draft-intake-api-lifecycle.ts"),
      "utf8",
    );
    const cloneTypes = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/types/draft-intake-clone-snapshot.ts"),
      "utf8",
    );

    expect(schemas).toContain(SYSTEM_NOT_JOB_CLONE_ENVELOPE_OPENAPI_SCHEMAS.cloneSnapshotResponse);
    expect(schemas).toContain(SYSTEM_NOT_JOB_CLONE_ENVELOPE_OPENAPI_SCHEMAS.branchRequest);
    expect(paths).toContain(SYSTEM_NOT_JOB_CLONE_SNAPSHOT_OPENAPI_PATH);
    expect(paths).toContain(SYSTEM_NOT_JOB_BRANCH_ENVELOPE_OPENAPI_PATH);
    expect(lifecycleApi).toContain("clone-snapshot");
    expect(lifecycleApi).toContain("/branch");
    expect(lifecycleApi).toContain("BranchDraftRequest");
    expect(cloneTypes).toContain("sourceDraftId");
    expect(cloneTypes).toContain("sourceSpawnedRunId");
  });
});
