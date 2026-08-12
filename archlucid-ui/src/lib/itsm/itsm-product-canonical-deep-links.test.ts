import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ITSM_PRODUCT_CANONICAL_DEEP_LINKS,
  ITSM_PRODUCT_HUB_HREF_BANNED_PATTERNS,
  ITSM_REMOVED_PRODUCT_HUB_PATH,
} from "@/lib/itsm/itsm-product-canonical-deep-links";
import { INTERNAL_ITSM_CONNECTORS_PATH } from "@/lib/internal-ops-route-paths";

const repoRoot = join(process.cwd(), "..");

const ITSM_PRODUCT_DEEP_LINK_SCAN_SURFACES = [
  "archlucid-ui/src/lib/usability/page-help-topic-map.ts",
  "archlucid-ui/src/lib/itsm/itsm-connectors-admin-scope.ts",
  "archlucid-ui/src/lib/itsm/itsm-oauth-callback-evidence-copy.ts",
  "archlucid-ui/src/app/(operator)/integrations/_sections/itsm/ItsmProductIntegrationPageClient.tsx",
  "archlucid-ui/src/app/(operator)/integrations/servicenow/_sections/ServiceNowIntegrationAside.tsx",
  "archlucid-ui/src/components/findings/FindingItsmExportPanel.tsx",
  "archlucid-ui/src/components/work-items/CreateWorkItemDialog.tsx",
] as const;

describe("itsm-product-canonical-deep-links (TB-1780)", () => {
  it("exports canonical product destinations", () => {
    expect(ITSM_PRODUCT_CANONICAL_DEEP_LINKS.adminConnectors).toBe(INTERNAL_ITSM_CONNECTORS_PATH);
    expect(ITSM_REMOVED_PRODUCT_HUB_PATH).toBe("/integrations/itsm");
  });

  it("keeps product surfaces off the removed hub path", () => {
    for (const relativePath of ITSM_PRODUCT_DEEP_LINK_SCAN_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");

      for (const banned of ITSM_PRODUCT_HUB_HREF_BANNED_PATTERNS) {
        expect(source).not.toContain(banned);
      }
    }

    const helpMap = readFileSync(join(repoRoot, ITSM_PRODUCT_DEEP_LINK_SCAN_SURFACES[0]), "utf8");
    expect(helpMap).toContain(INTERNAL_ITSM_CONNECTORS_PATH);
    expect(helpMap).not.toContain("/admin/integrations/itsm");
  });
});
