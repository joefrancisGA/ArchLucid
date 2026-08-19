import type { PilotValueReportJson } from "@/types/pilot-value-report";

/** Deterministic sponsor narrative from pilot outcomes report JSON — no ungrounded marketing claims. */
export function buildPilotOutcomesSponsorNarrative(report: PilotValueReportJson): string {
  const reviews = report.totalRunsCommitted;
  const findings = report.totalFindings;
  const decisions = report.governanceApprovals + report.governanceRejections;
  const monitoring = report.governancePendingApprovalsNow;
  const critical = report.findingsBySeverity.critical;
  const high = report.findingsBySeverity.high;
  const materialFindings = critical + high;

  const reviewPhrase =
    reviews === 1 ? "1 architecture review" : `${reviews} architecture reviews`;

  const findingPhrase =
    findings === 1 ? "1 finding" : `${findings} findings`;

  const decisionPhrase =
    decisions === 1 ? "1 governance decision" : `${decisions} governance decisions`;

  let materialClause = "";

  if (materialFindings > 0) {
    materialClause =
      materialFindings === 1
        ? " including 1 material (critical or high) finding"
        : ` including ${materialFindings} material (critical or high) findings`;
  }

  let monitoringClause = "";

  if (monitoring > 0) {
    monitoringClause =
      monitoring === 1
        ? " One item requires continuing monitoring"
        : ` ${monitoring} items require continuing monitoring`;
  }

  return `During the selected period, ArchLucid finalized ${reviewPhrase}, identified ${findingPhrase}${materialClause}, and recorded ${decisionPhrase}.${monitoringClause}.`;
}
