import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

const OPENAPI_SNAPSHOT_RELATIVE_PATH =
  "ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json";

const ARCHITECTURE_SHARE_API_RELATIVE_PATH =
  "archlucid-ui/src/lib/api/architecture-share-api.ts";

const SHARE_OPENAPI_PATHS = [
  "/v1/architectures/{architectureId}/shares",
  "/v1/architectures/{architectureId}/shares/{userId}",
  "/v1/architectures/{architectureId}/restrict-to-shares",
] as const;

const SHARE_OPENAPI_SCHEMAS = [
  "ArchitectureShareListResponse",
  "ArchitectureShareGrantResponse",
  "UpsertArchitectureShareRequest",
  "SetArchitectureRestrictToSharesRequest",
  "ArchitectureRestrictToSharesResponse",
] as const;

describe("architecture share API contract (AS-099)", () => {
  it("openapi snapshot documents share CRUD and restrict-to-shares routes", () => {
    const snapshotPath = join(REPO_ROOT, OPENAPI_SNAPSHOT_RELATIVE_PATH);

    expect(existsSync(snapshotPath), OPENAPI_SNAPSHOT_RELATIVE_PATH).toBe(true);

    const snapshot = readFileSync(snapshotPath, "utf8");

    for (const path of SHARE_OPENAPI_PATHS) {
      expect(snapshot).toContain(path);
    }

    for (const schema of SHARE_OPENAPI_SCHEMAS) {
      expect(snapshot).toContain(`"${schema}"`);
    }
  });

  it("ui share client imports generated OpenAPI schema types", () => {
    const apiPath = join(REPO_ROOT, ARCHITECTURE_SHARE_API_RELATIVE_PATH);

    expect(existsSync(apiPath), ARCHITECTURE_SHARE_API_RELATIVE_PATH).toBe(true);

    const source = readFileSync(apiPath, "utf8");

    expect(source).toContain('from "@/lib/api-types/schemas.generated"');
    expect(source).toContain("ArchitectureShareListResponse");
    expect(source).toContain("UpsertArchitectureShareRequest");
    expect(source).toContain("SetArchitectureRestrictToSharesRequest");
    expect(source).toContain("/restrict-to-shares");
  });
});
