/**
 * TB-2235 — Invitee first-screen specimen (finding → disposition → comment).
 *
 * Distinct from SpecimenDeliverablePreviewCallout (TB-2151), which previews a
 * creator's Finalized review record before intake. This specimen teaches invited
 * reviewers the first three review actions in buyer nouns.
 */

export type InviteeFirstScreenSpecimenStepId = "finding" | "disposition" | "comment";

export type InviteeFirstScreenSpecimenStep = {
  readonly id: InviteeFirstScreenSpecimenStepId;
  readonly label: string;
  readonly body: string;
};

export type InviteeFirstScreenSpecimenModel = {
  readonly heading: string;
  readonly lead: string;
  readonly steps: readonly InviteeFirstScreenSpecimenStep[];
};

export const INVITEE_FIRST_SCREEN_SPECIMEN_HEADING = "Your first review screen" as const;

export const INVITEE_FIRST_SCREEN_SPECIMEN_LEAD =
  "Start with a finding, record a disposition, then leave a comment — that is the invitee path on an architecture package." as const;

export const INVITEE_FIRST_SCREEN_SPECIMEN_STEPS: readonly InviteeFirstScreenSpecimenStep[] = [
  {
    id: "finding",
    label: "Finding",
    body: "Open a finding on the architecture package to see the risk and its evidence trail.",
  },
  {
    id: "disposition",
    label: "Disposition",
    body: "Record a disposition so the decision register reflects accept, mitigate, or exception.",
  },
  {
    id: "comment",
    label: "Comment",
    body: "Add a comment to explain the disposition for the architecture owner and auditors.",
  },
] as const;

/** Full invitee specimen model (heading, lead, three review steps). */
export function buildInviteeFirstScreenSpecimen(): InviteeFirstScreenSpecimenModel {
  return {
    heading: INVITEE_FIRST_SCREEN_SPECIMEN_HEADING,
    lead: INVITEE_FIRST_SCREEN_SPECIMEN_LEAD,
    steps: INVITEE_FIRST_SCREEN_SPECIMEN_STEPS,
  };
}
