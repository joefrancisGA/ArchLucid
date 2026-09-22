import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { OperateGovernanceNavGroupBuilder } from "@/lib/operate-governance-nav-group-builder";
import {
  DESK_IA_GOVERNANCE_NAV_BUILDER_MODULE,
  DESK_IA_GOVERNANCE_NAV_SEALED_RECORDS_HREF,
} from "@/lib/desk-ia-governance-nav-sealed-records";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

const REPO_ROOT = join(process.cwd(), "..");

describe("desk-ia Governance nav sealed records (DI-020)", () => {
  it("includes sealed review records in operate-governance nav group", () => {
    const group = new OperateGovernanceNavGroupBuilder().build();
    const sealedLink = group.links.find((link) => link.href === DESK_IA_GOVERNANCE_NAV_SEALED_RECORDS_HREF);

    expect(sealedLink).toBeDefined();
    expect(sealedLink?.label).toBe(OPERATOR_NAV_LINK_LABELS.sealedReviewRecords);
    expect(sealedLink?.requiredAuthority).toBe("ReadAuthority");
  });

  it("builder module cites SIGNED_RECORDS_LIST_PATH", () => {
    const source = readFileSync(join(REPO_ROOT, DESK_IA_GOVERNANCE_NAV_BUILDER_MODULE), "utf8");

    expect(source).toContain("SIGNED_RECORDS_LIST_PATH");
    expect(source).toContain("sealedReviewRecords");
  });
});
