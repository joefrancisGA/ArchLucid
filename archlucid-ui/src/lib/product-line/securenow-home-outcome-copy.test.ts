import { describe, expect, it } from "vitest";

import { INFRASTRUCTURE_WORKBENCH_ROWS } from "@/lib/governance/governance-infrastructure-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { SECURENOW_COMPLIANCE_HOME_ROWS } from "@/lib/product-line/securenow-compliance-home-copy";
import { SECURENOW_DATA_SOURCES_HOME_ROWS } from "@/lib/product-line/securenow-data-sources-home-copy";
import { SECURENOW_INFRASTRUCTURE_HOME_ROWS } from "@/lib/product-line/securenow-infrastructure-home-copy";
import {
  SECURENOW_FINDINGS_HOME_ROWS,
  SECURENOW_REMEDIATION_HOME_ROWS,
} from "@/lib/product-line/securenow-security-home-copy";
import { SECURENOW_NAV_LABELS } from "@/lib/product-line/securenow-nav-labels";

const HOME_ROWS = [
  ...SECURENOW_FINDINGS_HOME_ROWS,
  ...SECURENOW_INFRASTRUCTURE_HOME_ROWS,
  ...SECURENOW_REMEDIATION_HOME_ROWS,
  ...SECURENOW_COMPLIANCE_HOME_ROWS,
  ...SECURENOW_DATA_SOURCES_HOME_ROWS,
];

const FORBIDDEN_PHRASES = [
  "advisory-only execute honesty",
  "explainable correspondence rows",
  "effective ARC-AMPE rules",
];

describe("SecureNow home outcome copy", () => {
  it("uses sidebar labels for every home row whose href is in the label map", () => {
    for (const row of HOME_ROWS) {
      const sidebarLabel = SECURENOW_NAV_LABELS[row.href];

      if (sidebarLabel === undefined) {
        continue;
      }

      expect(row.label, row.href).toBe(sidebarLabel);
    }
  });

  it("does not describe implementation jargon on SecureNow Home", () => {
    const copy = HOME_ROWS.map((row) => `${row.label} ${row.summary}`).join("\n");

    for (const phrase of FORBIDDEN_PHRASES) {
      expect(copy).not.toContain(phrase);
    }
  });

  it("keeps Azure and Terraform honesty on the outcome summaries", () => {
    const tracker = HOME_ROWS.find((row) => row.href === "/security/remediation-instances");
    const terraform = HOME_ROWS.find((row) => row.href === "/infrastructure/terraform");

    expect(tracker?.summary).toContain("does not change Azure");
    expect(terraform?.summary).toContain("does not apply it");
  });

  it("uses sidebar labels for data-source rows", () => {
    expect(SECURENOW_DATA_SOURCES_HOME_ROWS.map((row) => row.href)).toEqual([
      "/integrations/cloud-connections",
      "/infrastructure/collection-agent",
      "/infrastructure/declared-connections",
      "/administration/connection-status",
      "/infrastructure/manual-upload",
    ]);
    expect(SECURENOW_DATA_SOURCES_HOME_ROWS.map((row) => row.label)).toEqual(
      SECURENOW_DATA_SOURCES_HOME_ROWS.map((row) => SECURENOW_NAV_LABELS[row.href]),
    );
    expect(SECURENOW_DATA_SOURCES_HOME_ROWS.filter((row) => row.recommendedFirst)).toHaveLength(1);
    expect(SECURENOW_DATA_SOURCES_HOME_ROWS[0]?.recommendedFirst).toBe(true);
  });

  it("leaves Architecture workbench labels on the operator names", () => {
    const resources = INFRASTRUCTURE_WORKBENCH_ROWS.find(
      (row) => row.href === "/governance/infrastructure/resources",
    );

    expect(resources?.label).toBe(OPERATOR_NAV_LINK_LABELS.infrastructureResources);
    expect(resources?.label).toBe("Resource explorer");
  });
});
