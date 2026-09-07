import { describe, expect, it } from "vitest";

import { composeOperatorHomeSections } from "@/lib/compose-operator-home-sections";
import { flattenNavLinks } from "@/lib/nav-config";
import { OperatorAdminNavGroupBuilder } from "@/lib/operator/operator-admin-nav-group-builder";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";

describe("operator private-beta nav band (wave 3+4)", () => {
  it("keeps administration users and reviews hub in flattened nav for beta operators", () => {
    const hrefs = flattenNavLinks().map((link) => link.href);

    expect(hrefs).toContain("/administration/users");
    expect(hrefs).toContain(REVIEWS_LIST_PATH);
  });

  it("keeps identity and SCIM admin destinations in the operator-admin group", () => {
    const adminGroup = new OperatorAdminNavGroupBuilder().build();
    const adminHrefs = adminGroup.links.map((link) => link.href);

    expect(adminHrefs).toContain("/administration/users");
    expect(adminHrefs).toContain("/administration/scim-provisioning");
    expect(adminHrefs).toContain("/administration/identity-providers");
  });

  it("composes eval-empty operator home with hero for first-review onboarding", () => {
    const sections = composeOperatorHomeSections({
      phaseSignals: {
        hasWorkspaceReviews: false,
        hasOverviewReviewRows: false,
        draftCount: 0,
        hasCommittedManifest: false,
        openFindingsCount: 0,
        governanceWarningsCount: 0,
      },
      buyerPolishedShell: true,
      metrics: {
        reviewPackagesTotal: 0,
        reviewPackagesCommitted: 0,
        reviewPackagesActive: 0,
        reviewPackagesAwaitingApproval: 0,
        openFindings: 0,
        governanceWarnings: 0,
        evidenceSources: 0,
        hasReviews: false,
      },
    });

    expect(sections.map((section) => section.id)).toContain("hero");
  });
});
