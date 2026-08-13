/**
 * TB-2236 — ITSM outbound triad clarity.
 *
 * Three related jobs on a finding:
 * - Create an external ticket (Jira / ServiceNow / Azure Boards)
 * - Disposition the finding in ArchLucid
 * - Review inbound human-review queue state from ITSM sync
 *
 * They stay separate because creating a ticket does not dispose the finding,
 * and inbound queue status is last-writer sync state — not the disposition trail.
 * Do not invent new API; this is vocabulary-only.
 */

export type ItsmOutboundTriadJobId =
  | "create-ticket"
  | "disposition-finding"
  | "inbound-human-review-queue";

export type ItsmOutboundTriadJob = {
  readonly id: ItsmOutboundTriadJobId;
  readonly label: string;
  readonly whenToUse: string;
};

export type ItsmOutboundTriadClarityModel = {
  readonly heading: string;
  readonly whyThree: string;
  readonly compactLine: string;
  readonly jobs: readonly ItsmOutboundTriadJob[];
};

export const ITSM_OUTBOUND_TRIAD_HEADING = "Three ITSM jobs on a finding" as const;

export const ITSM_OUTBOUND_TRIAD_WHY_THREE =
  "Creating a linked ticket opens work in Jira, ServiceNow, or Azure Boards. Disposition records the governance decision on the finding. Inbound human-review queue state reflects the last ITSM sync — it is not the disposition trail. Do each job intentionally; none replaces the others." as const;

export const ITSM_OUTBOUND_TRIAD_COMPACT_LINE =
  "Create a ticket, disposition the finding, and check inbound human-review queue — three jobs, not one." as const;

export const ITSM_OUTBOUND_TRIAD_JOBS: readonly ItsmOutboundTriadJob[] = [
  {
    id: "create-ticket",
    label: "Create ticket",
    whenToUse: "Open a linked work item in Jira, ServiceNow, or Azure Boards from this finding.",
  },
  {
    id: "disposition-finding",
    label: "Disposition finding",
    whenToUse: "Record accept, mitigate, or exception on the finding in ArchLucid.",
  },
  {
    id: "inbound-human-review-queue",
    label: "Inbound human-review queue",
    whenToUse: "Read last-writer ITSM sync status for human review — separate from disposition.",
  },
] as const;

/** Full triad clarity model (heading, why-three, three jobs). */
export function buildItsmOutboundTriadClarity(): ItsmOutboundTriadClarityModel {
  return {
    heading: ITSM_OUTBOUND_TRIAD_HEADING,
    whyThree: ITSM_OUTBOUND_TRIAD_WHY_THREE,
    compactLine: ITSM_OUTBOUND_TRIAD_COMPACT_LINE,
    jobs: ITSM_OUTBOUND_TRIAD_JOBS,
  };
}

/** Resolve a single job by id (null when unknown). */
export function resolveItsmOutboundTriadJob(
  jobId: ItsmOutboundTriadJobId,
): ItsmOutboundTriadJob | null {
  const match = ITSM_OUTBOUND_TRIAD_JOBS.find((job) => job.id === jobId);

  if (match === undefined) {
    return null;
  }

  return match;
}
