import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  V10_QUALITY_ROI_QR_16_API_TYPES_SCHEMAS_PATH,
  V10_QUALITY_ROI_QR_16_CI_WORKFLOW_PATH,
  V10_QUALITY_ROI_QR_16_INVENTORY_BINDING_API_PATH,
  V10_QUALITY_ROI_QR_16_OPENAPI_CONTRACT_TESTS_PATH,
  V10_QUALITY_ROI_QR_16_OPENAPI_SNAPSHOT_PATH,
  V10_QUALITY_ROI_QR_16_UPDATE_OPENAPI_SCRIPT_PATH,
} from "@/lib/v10-quality-roi-inventory";

const REPO_ROOT = join(process.cwd(), "..");

const INVENTORY_BINDING_OPENAPI_PATH = "/v1/architectures/{architectureId}/inventory-binding";

const INVENTORY_BINDING_OPENAPI_SCHEMAS = [
  "ArchitectureInventoryBindingResponse",
  "AttachArchitectureInventoryBindingRequest",
] as const;

describe("v10 quality-ROI ratchet (QR-16)", () => {
  it("QR-16: OpenAPI snapshot and contract test exist on trunk", () => {
    expect(existsSync(join(REPO_ROOT, V10_QUALITY_ROI_QR_16_OPENAPI_SNAPSHOT_PATH))).toBe(true);
    expect(existsSync(join(REPO_ROOT, V10_QUALITY_ROI_QR_16_OPENAPI_CONTRACT_TESTS_PATH))).toBe(true);

    const tests = readFileSync(join(REPO_ROOT, V10_QUALITY_ROI_QR_16_OPENAPI_CONTRACT_TESTS_PATH), "utf8");

    expect(tests).toContain("OpenApi_v1_json_is_backward_compatible_with_committed_snapshot");
    expect(tests).toContain("ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT");
  });

  it("QR-16: regen script refreshes snapshot and optional UI api-types", () => {
    const script = readFileSync(join(REPO_ROOT, V10_QUALITY_ROI_QR_16_UPDATE_OPENAPI_SCRIPT_PATH), "utf8");

    expect(script).toContain("ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT=1");
    expect(script).toContain("ARCHLUCID_REGENERATE_UI_API_TYPES");
    expect(script).toContain("check_openapi_contract_snapshot.sh");
  });

  it("QR-16: snapshot documents AS-048 inventory-binding routes and schemas", () => {
    const snapshot = readFileSync(join(REPO_ROOT, V10_QUALITY_ROI_QR_16_OPENAPI_SNAPSHOT_PATH), "utf8");

    expect(snapshot).toContain(INVENTORY_BINDING_OPENAPI_PATH);

    for (const schema of INVENTORY_BINDING_OPENAPI_SCHEMAS) {
      expect(snapshot).toContain(`"${schema}"`);
    }
  });

  it("QR-16: generated TS types and UI client import inventory-binding schemas", () => {
    const schemas = readFileSync(join(REPO_ROOT, V10_QUALITY_ROI_QR_16_API_TYPES_SCHEMAS_PATH), "utf8");
    const apiClient = readFileSync(join(REPO_ROOT, V10_QUALITY_ROI_QR_16_INVENTORY_BINDING_API_PATH), "utf8");

    for (const schema of INVENTORY_BINDING_OPENAPI_SCHEMAS) {
      expect(schemas).toContain(schema);
    }

    expect(apiClient).toContain('from "@/lib/api-types/schemas.generated"');
    expect(apiClient).toContain("/inventory-binding");
  });

  it("QR-16: CI workflow runs openapi-contract-snapshot fail-fast job", () => {
    const workflow = readFileSync(join(REPO_ROOT, V10_QUALITY_ROI_QR_16_CI_WORKFLOW_PATH), "utf8");

    expect(workflow).toContain("openapi-contract-snapshot:");
    expect(workflow).toContain("OpenApiContractSnapshotTests");
  });
});
