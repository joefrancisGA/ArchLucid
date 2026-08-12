import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ITSM_NATIVE_CREATE_ADMIN_HREF,
  ITSM_NATIVE_CREATE_REQUIRED_UI_TEST_IDS,
} from "@/lib/itsm/itsm-native-create-readiness-alignment";
import { REPO_ROOT } from "@/lib/testing/repo-paths";

function readRepoFile(relativePath: string): string {
  return readFileSync(join(REPO_ROOT, relativePath), "utf8");
}

describe("itsm-native-create-readiness-alignment", () => {
  it("exports stable admin href for connector configuration", () => {
    expect(ITSM_NATIVE_CREATE_ADMIN_HREF).toBe("/administration/connection-status");
  });

  it("keeps native default panel and wizard wiring on finding and admin surfaces", () => {
    const findingPanel = readRepoFile("archlucid-ui/src/components/findings/FindingItsmExportPanel.tsx");
    const findingDetail = readRepoFile(
      "archlucid-ui/src/app/(operator)/architecture/reviews/[runId]/findings/[findingId]/_sections/FindingDetailPageView.tsx",
    );
    const itsmWorkflow = readRepoFile(
      "archlucid-ui/src/app/(operator)/architecture/reviews/[runId]/findings/[findingId]/FindingInspectItsmWorkflowPanel.tsx",
    );
    const adminPage = readRepoFile(
      "archlucid-ui/src/app/(operator)/internal/integrations/itsm/_sections/AdminItsmConnectorsPageClient.tsx",
    );
    const wizard = readRepoFile(
      "archlucid-ui/src/app/(operator)/internal/integrations/itsm/_sections/AdminItsmConnectorOnboardingWizard.tsx",
    );

    const findingSurfaces = `${findingPanel}\n${findingDetail}\n${itsmWorkflow}`;
    const adminSurfaces = `${adminPage}\n${wizard}`;

    expect(findingSurfaces).toContain("FindingItsmExportPanel");
    expect(findingSurfaces).toContain("ItsmOutboundCreateIssueDialog");
    expect(findingSurfaces).toContain("ItsmOutboundQuickActions");
    expect(adminSurfaces).toContain("AdminItsmConnectorOnboardingWizard");

    for (const testId of ITSM_NATIVE_CREATE_REQUIRED_UI_TEST_IDS) {
      expect(`${findingPanel}\n${wizard}`).toContain(testId);
    }

    expect(wizard).toContain("resolveItsmOnboardingWizardInitialStep");
    expect(findingPanel).toContain("useItsmNativeCreateReadiness");
  });
});
