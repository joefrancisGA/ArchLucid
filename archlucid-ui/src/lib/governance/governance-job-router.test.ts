import { describe, expect, it } from "vitest";

import { DECISION_REGISTER_CANONICAL_PATH } from "@/lib/decision-register-evidence-copy";
import { GOVERNANCE_FINDINGS_CANONICAL_PATH } from "@/lib/governance/governance-findings-evidence-copy";
import {
  GOVERNANCE_JOB_APPROVE_GOVERNANCE,
  GOVERNANCE_JOB_RECORD_DECISIONS,
  GOVERNANCE_JOB_ROUTER_HEADING,
  GOVERNANCE_JOB_TRIAGE_FINDINGS,
  buildGovernanceJobRouterOptions,
  getGovernanceJobRouter,
  type GovernanceJobId,
} from "@/lib/governance/governance-job-router";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";

describe("governance-job-router (TB-2199 / TB-2230)", () => {
  it("buildGovernanceJobRouterOptions returns the approval ↔ findings ↔ decisions triad", () => {
    const options = buildGovernanceJobRouterOptions();

    expect(options).toHaveLength(3);
    expect(options[0]).toEqual(GOVERNANCE_JOB_APPROVE_GOVERNANCE);
    expect(options[1]).toEqual(GOVERNANCE_JOB_TRIAGE_FINDINGS);
    expect(options[2]).toEqual(GOVERNANCE_JOB_RECORD_DECISIONS);
  });

  it("getGovernanceJobRouter returns heading and options", () => {
    const router = getGovernanceJobRouter();

    expect(router.heading).toBe(GOVERNANCE_JOB_ROUTER_HEADING);
    expect(router.heading).toBe("Which job am I doing?");
    expect(router.options).toEqual(buildGovernanceJobRouterOptions());
  });

  it("points each job at its canonical governance home", () => {
    expect(GOVERNANCE_JOB_APPROVE_GOVERNANCE.id).toBe("approve-governance");
    expect(GOVERNANCE_JOB_APPROVE_GOVERNANCE.href).toBe(GOVERNANCE_APPROVAL_QUEUE_PATH);
    expect(GOVERNANCE_JOB_APPROVE_GOVERNANCE.href).toBe("/governance/approval-queue");

    expect(GOVERNANCE_JOB_TRIAGE_FINDINGS.id).toBe("triage-findings");
    expect(GOVERNANCE_JOB_TRIAGE_FINDINGS.href).toBe(GOVERNANCE_FINDINGS_CANONICAL_PATH);
    expect(GOVERNANCE_JOB_TRIAGE_FINDINGS.href).toBe("/governance/findings");

    expect(GOVERNANCE_JOB_RECORD_DECISIONS.id).toBe("record-decisions");
    expect(GOVERNANCE_JOB_RECORD_DECISIONS.href).toBe(DECISION_REGISTER_CANONICAL_PATH);
    expect(GOVERNANCE_JOB_RECORD_DECISIONS.href).toBe("/governance/decision-register");
  });

  it("keeps non-empty labels and when-to-use copy with buyer nouns", () => {
    const options = buildGovernanceJobRouterOptions();

    for (const option of options) {
      expect(option.label.trim().length).toBeGreaterThan(4);
      expect(option.whenToUse.trim().length).toBeGreaterThan(20);
    }

    const corpus = options
      .map((option) => `${option.label}\n${option.whenToUse}`)
      .join("\n")
      .toLowerCase();

    expect(corpus).toContain("approv");
    expect(corpus).toContain("finding");
    expect(corpus).toContain("decision");
    expect(corpus).toContain("governance");
    expect(corpus).toMatch(/submit|package/);
  });

  it("exposes a closed GovernanceJobId union via option ids", () => {
    const ids: GovernanceJobId[] = buildGovernanceJobRouterOptions().map((option) => option.id);

    expect(ids).toEqual(["approve-governance", "triage-findings", "record-decisions"]);
  });
});
