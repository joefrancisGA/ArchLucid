import { describe, expect, it } from "vitest";

import type { CurrentPrincipal } from "@/lib/current-principal";
import {
  resolveInviteeFirstOrientationCopy,
  resolveInviteeHomeOrientationCopy,
  resolveInviteeOrientationContext,
} from "@/lib/invitee-first-orientation";

const readerPrincipal: CurrentPrincipal = {
  provenance: "auth-me",
  name: "Reader User",
  roleClaimValues: ["Reader"],
  primaryAppRole: "Reader",
  maxAuthority: "ReadAuthority",
  authorityRank: 1,
  hasEnterpriseOperatorSurfaces: false,
  hasCommittedArchitectureReview: false,
  hasRecognizedArchLucidRole: true,
  permissionClaimValues: [],
};

const operatorPrincipal: CurrentPrincipal = {
  ...readerPrincipal,
  roleClaimValues: ["Operator"],
  primaryAppRole: "Operator",
  maxAuthority: "ExecuteAuthority",
  authorityRank: 2,
  hasEnterpriseOperatorSurfaces: true,
};

describe("invitee-first-orientation (TB-2182)", () => {
  it("detects invited Reader principals as invitee reviewers", () => {
    expect(resolveInviteeOrientationContext(readerPrincipal).isInviteeReviewer).toBe(true);
  });

  it("does not treat Execute-tier operators as invitee reviewers", () => {
    expect(resolveInviteeOrientationContext(operatorPrincipal).isInviteeReviewer).toBe(false);
  });

  it("builds review-scoped orientation copy with findings CTA", () => {
    const copy = resolveInviteeFirstOrientationCopy({
      packageOwnerLabel: "Alex Architect",
      runId: "run-abc",
    });

    expect(copy.jobSentence).toContain("Alex Architect");
    expect(copy.findingsCtaHref).toContain("run-abc");
    expect(copy.findingsCtaHref).toContain("reviewTab=findings");
  });

  it("builds home orientation copy pointing at the governance findings queue", () => {
    const copy = resolveInviteeHomeOrientationCopy();

    expect(copy.findingsCtaHref).toBe("/governance/findings");
    expect(copy.jobSentence).toContain("not to run intake");
  });
});
