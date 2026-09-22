import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  V8_QUALITY_ROI_QR_01_DECISIONING_GRAPH_FACTORY_PATH,
  V8_QUALITY_ROI_QR_02_ADVISORY_SURFACES_SCRIPT_PATH,
  V8_QUALITY_ROI_QR_03_OPENAPI_SNAPSHOT_PATH,
  V8_QUALITY_ROI_QR_04_CI_WORKFLOW_PATH,
  V8_QUALITY_ROI_QR_05_DISTRIBUTION_DOC_PATH,
  V8_QUALITY_ROI_QR_05_SECURITY_BASELINE_ENGINE_PATH,
} from "@/lib/v8-quality-roi-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("v8 quality-ROI ratchet (QR-01–QR-05)", () => {
  it("QR-01: GoldenCorpus graph factory uses three-arg DefaultGraphBuilder", () => {
    const source = readFileSync(join(REPO_ROOT, V8_QUALITY_ROI_QR_01_DECISIONING_GRAPH_FACTORY_PATH), "utf8");

    expect(source).toMatch(/DefaultGraphBuilder builder = new\(/);
    expect(source).toMatch(/StructuredDiagramGraphMerger/);
    expect(source).not.toMatch(/DefaultGraphBuilder builder = new\(\s*NodeFactory\s*\)/);
  });

  it("QR-02: advisory surfaces script requires typed-engine-scored markers", () => {
    const script = readFileSync(join(REPO_ROOT, V8_QUALITY_ROI_QR_02_ADVISORY_SURFACES_SCRIPT_PATH), "utf8");

    expect(script).toMatch(/typed-engine-scored/);
    expect(script).toMatch(/claimBoundary/);
  });

  it("QR-03: OpenAPI v1 snapshot exists on trunk", () => {
    expect(existsSync(join(REPO_ROOT, V8_QUALITY_ROI_QR_03_OPENAPI_SNAPSHOT_PATH))).toBe(true);
  });

  it("QR-04: CI workflow wires merge_group corset guard", () => {
    const workflow = readFileSync(join(REPO_ROOT, V8_QUALITY_ROI_QR_04_CI_WORKFLOW_PATH), "utf8");

    expect(workflow).toMatch(/merge_group/);
    expect(workflow).toMatch(/semantic conflict guard/i);
  });

  it("QR-05: security-baseline engine and distribution doc reference typed-engine-scored", () => {
    const engine = readFileSync(join(REPO_ROOT, V8_QUALITY_ROI_QR_05_SECURITY_BASELINE_ENGINE_PATH), "utf8");
    const distribution = readFileSync(join(REPO_ROOT, V8_QUALITY_ROI_QR_05_DISTRIBUTION_DOC_PATH), "utf8");

    expect(engine).toContain("SecurityBaselineFindingEngine");
    expect(distribution).toMatch(/typed-engine-scored/);
  });
});
