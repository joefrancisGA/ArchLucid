import { describe, expect, it } from "vitest";

import { flattenNavLinks } from "@/lib/nav-config";
import { OperatorAdminNavGroupBuilder } from "@/lib/operator/operator-admin-nav-group-builder";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";

describe("operator private-beta nav band (wave 3)", () => {
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
});
