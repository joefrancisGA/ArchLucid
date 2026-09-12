import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { architectureNestedFindingsPath } from "@/lib/architecture/architecture-routes";
import {
  resolveGovernanceFindingsClaimDiscipline,
  resolveGovernanceFindingsPageSubtitle,
} from "@/app/(operator)/governance/findings/governance-findings-queue-presentation";
import { GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE } from "@/lib/governance/governance-findings-evidence-copy";
import { GOVERNANCE_FINDINGS_PAGE_SUBTITLE_BUYER } from "@/lib/governance-findings-page-copy";
import { ARCHITECTURE_RISK_REGISTER_PAGE_SUBTITLE } from "@/lib/architecture/architecture-risk-register-copy";
import {
  resolveSystemNotJobFindingsSurface,
  resolveSystemNotJobGovernanceFindingsClaimDiscipline,
  resolveSystemNotJobGovernanceFindingsPageSubtitle,
  SYSTEM_NOT_JOB_FINDINGS_ARE_VERBS_DOC_ANCHOR,
  SYSTEM_NOT_JOB_FINDINGS_ARE_VERBS_OWNER,
  SYSTEM_NOT_JOB_WORKING_GOVERNANCE_FINDINGS_PAGE_SUBTITLE,
  SYSTEM_NOT_JOB_WORKING_NESTED_FINDINGS_PAGE_SUBTITLE,
} from "@/lib/system-not-job-findings-are-verbs-on-the-system";

const REPO_ROOT = join(process.cwd(), "..");
const architectureId = "architecture-identity-001";
const nestedFindingsPath = architectureNestedFindingsPath(architectureId);

describe("SN-023 findings are verbs on the system", () => {
  it("detects nested desk findings vs governance register surfaces", () => {
    expect(resolveSystemNotJobFindingsSurface(nestedFindingsPath)).toBe("nested-desk");
    expect(resolveSystemNotJobFindingsSurface("/governance/findings")).toBe("governance-register");
  });

  it("uses cross-architecture register copy on Working governance findings", () => {
    expect(
      resolveSystemNotJobGovernanceFindingsPageSubtitle({
        workingMode: true,
        pathname: "/governance/findings",
        guidedCopy: ARCHITECTURE_RISK_REGISTER_PAGE_SUBTITLE,
      }),
    ).toBe(SYSTEM_NOT_JOB_WORKING_GOVERNANCE_FINDINGS_PAGE_SUBTITLE);
    expect(
      resolveSystemNotJobGovernanceFindingsClaimDiscipline({
        workingMode: true,
        pathname: "/governance/findings",
        guidedCopy: GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE,
      }).toLowerCase(),
    ).toContain("cross-architecture");
    expect(
      resolveSystemNotJobGovernanceFindingsClaimDiscipline({
        workingMode: true,
        pathname: "/governance/findings",
        guidedCopy: GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE,
      }),
    ).toContain("Alt+G");
  });

  it("uses desk findings copy on Working nested architecture routes", () => {
    expect(
      resolveSystemNotJobGovernanceFindingsPageSubtitle({
        workingMode: true,
        pathname: nestedFindingsPath,
        guidedCopy: ARCHITECTURE_RISK_REGISTER_PAGE_SUBTITLE,
      }),
    ).toBe(SYSTEM_NOT_JOB_WORKING_NESTED_FINDINGS_PAGE_SUBTITLE);
    expect(
      resolveSystemNotJobGovernanceFindingsClaimDiscipline({
        workingMode: true,
        pathname: nestedFindingsPath,
        guidedCopy: GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE,
      }).toLowerCase(),
    ).toContain("this architecture");
  });

  it("keeps Guided governance findings copy unchanged", () => {
    expect(
      resolveGovernanceFindingsPageSubtitle(false, true, "architecture", {
        workingMode: false,
        pathname: "/governance/findings",
      }),
    ).toBe(GOVERNANCE_FINDINGS_PAGE_SUBTITLE_BUYER);
    expect(
      resolveGovernanceFindingsClaimDiscipline(false, "architecture", true, {
        workingMode: false,
        pathname: nestedFindingsPath,
      }),
    ).toBe(GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE);
  });

  it("wires presentation helpers through the SN-023 resolver", () => {
    const presentation = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/app/(operator)/governance/findings/governance-findings-queue-presentation.ts"),
      "utf8",
    );
    const header = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/app/(operator)/governance/findings/GovernanceFindingsQueueHeader.tsx"),
      "utf8",
    );

    expect(SYSTEM_NOT_JOB_FINDINGS_ARE_VERBS_OWNER).toBe("SN-023");
    expect(SYSTEM_NOT_JOB_FINDINGS_ARE_VERBS_DOC_ANCHOR).toContain("0079");
    expect(existsSync(join(REPO_ROOT, SYSTEM_NOT_JOB_FINDINGS_ARE_VERBS_DOC_ANCHOR))).toBe(true);
    expect(presentation).toContain("resolveSystemNotJobGovernanceFindingsPageSubtitle");
    expect(header).toContain("resolveGovernanceFindingsClaimDiscipline");
  });
});
