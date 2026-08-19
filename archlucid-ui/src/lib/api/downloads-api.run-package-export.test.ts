import { describe, expect, it } from "vitest";

import { getRunPackageExportUrl } from "@/lib/api/downloads-api";

describe("getRunPackageExportUrl", () => {
  it("builds the RunsExportController proxy path with encoded run id", () => {
    expect(getRunPackageExportUrl("customer-intake-modernization", "docx")).toBe(
      "/api/proxy/v1/runs/customer-intake-modernization/export/docx",
    );
  });

  it("encodes special characters in run id", () => {
    expect(getRunPackageExportUrl("run/with spaces", "pdf")).toBe(
      "/api/proxy/v1/runs/run%2Fwith%20spaces/export/pdf",
    );
  });
});
