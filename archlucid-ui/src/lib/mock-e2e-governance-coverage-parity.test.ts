import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("mock E2E governance coverage preview parity", () => {
  it("routes the read-only POST before unsupported-method fallback without inventing coverage", () => {
    const source = readFileSync(
      join(process.cwd(), "e2e", "mock-archlucid-api-server.ts"),
      "utf8",
    );
    const marker = 'if (req.method === "POST" && pathname === "/v1/governance/coverage/preview")';
    const start = source.indexOf(marker);
    const fallback = source.indexOf('if (req.method !== "GET")');
    expect(start).toBeGreaterThanOrEqual(0);
    expect(fallback).toBeGreaterThan(start);

    const handler = source.slice(start, fallback);
    expect(handler).toContain("CoveragePreviewResponse");
    expect(handler).toContain("sendJson(res, 200, preview)");
    expect(handler).toContain("assignments: []");
    expect(handler).toContain("coverage was not evaluated");
    for (const key of [
      "providerNeutralBaselineCount",
      "organizationRequiredCount",
      "platformOverlayCount",
      "contextualRecommendedCount",
      "additionalOptionalCount",
    ]) {
      expect(handler).toContain(`${key}: 0`);
    }
  });

  it("mirrors the actual governance controller POST success contract", () => {
    const controller = readFileSync(
      join(process.cwd(), "..", "ArchLucid.Api", "Controllers", "Governance", "GovernanceCoverageController.cs"),
      "utf8",
    );
    const action = controller.split('[HttpPost("coverage/preview")]')[1]?.split('[HttpGet("coverage")]')[0];
    expect(action).toContain("[ProducesResponseType(typeof(CoveragePreviewResponse), StatusCodes.Status200OK)]");
    expect(action).toContain("return Ok(response)");
    expect(action).toContain("Read-only coverage preview");
  });
});
