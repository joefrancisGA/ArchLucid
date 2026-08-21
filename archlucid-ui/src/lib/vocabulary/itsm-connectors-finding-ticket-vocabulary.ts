/**
 * TB-2310 — ITSM connectors ≠ Finding ticket linkage vocabulary rail.
 *
 * Why two surfaces exist:
 * - ITSM connectors (`/internal/integrations/itsm`) configures Jira/ServiceNow
 *   credentials, routing, and connector health for the deployment/tenant.
 * - Finding ticket linkage (finding inspect ITSM workflow) creates or links an
 *   external ticket for one finding.
 *
 * They stay separate because configuring connectors is not opening a ticket from
 * a finding. Distinct from finding-correlation vocabulary (three senses of
 * “correlation”) and Alerts ≠ Findings dual-inbox teaching.
 */

import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { ITSM_CONNECTORS_ADMIN_PATH } from "@/lib/itsm/itsm-connectors-admin-scope";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type ItsmConnectorsFindingTicketSurfaceId =
  | "itsm-connectors"
  | "finding-ticket-linkage";

export type ItsmConnectorsFindingTicketLink = {
  readonly id: ItsmConnectorsFindingTicketSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ItsmConnectorsFindingTicketVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly itsmConnectorsLink: ItsmConnectorsFindingTicketLink;
  readonly findingTicketLinkageLink: ItsmConnectorsFindingTicketLink;
};

export const ITSM_CONNECTORS_FINDING_TICKET_HEADING =
  "ITSM connectors and Finding ticket linkage serve different purposes" as const;

export const ITSM_CONNECTORS_FINDING_TICKET_WHY_TWO =
  "ITSM connectors configures Jira and ServiceNow credentials, routing, and connector health. Finding ticket linkage creates or links an external ticket for one finding. Configuring connectors does not open a ticket from a finding." as const;

export const ITSM_CONNECTORS_FINDING_TICKET_COMPACT_LINE =
  "ITSM connectors configures Jira/ServiceNow; Finding ticket linkage opens a ticket from a finding." as const;

export const ITSM_CONNECTORS_FINDING_TICKET_CONNECTORS_LINK: ItsmConnectorsFindingTicketLink =
  {
    id: "itsm-connectors",
    label: "ITSM connectors",
    href: ITSM_CONNECTORS_ADMIN_PATH,
    whenToUse: "Configure Jira/ServiceNow credentials, routing, and connector health.",
  };

/**
 * Peer from ITSM connectors: Findings queue, because ticket linkage is finding-scoped
 * (open a finding, then use Sync / ticket linkage).
 */
export const ITSM_CONNECTORS_FINDING_TICKET_FINDINGS_PEER_LINK: ItsmConnectorsFindingTicketLink =
  {
    id: "finding-ticket-linkage",
    label: "Findings (open ticket from a finding)",
    href: GOVERNANCE_FINDINGS_PATH,
    whenToUse: "Open a finding, then create or link an external ITSM ticket.",
  };

/** Pairwise model for ITSM connectors ↔ Finding ticket linkage (fixed routes). */
export function buildItsmConnectorsFindingTicketPairwiseRail(): PairwiseVocabularyRailModel<ItsmConnectorsFindingTicketSurfaceId> {
  return {
    heading: ITSM_CONNECTORS_FINDING_TICKET_HEADING,
    whyTwo: ITSM_CONNECTORS_FINDING_TICKET_WHY_TWO,
    compactLine: ITSM_CONNECTORS_FINDING_TICKET_COMPACT_LINE,
    currentLink: ITSM_CONNECTORS_FINDING_TICKET_CONNECTORS_LINK,
    peerLink: ITSM_CONNECTORS_FINDING_TICKET_FINDINGS_PEER_LINK,
  };
}

/** Full vocabulary model. */
export function buildItsmConnectorsFindingTicketVocabulary(): ItsmConnectorsFindingTicketVocabularyModel {
  const rail = buildItsmConnectorsFindingTicketPairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    itsmConnectorsLink: rail.currentLink,
    findingTicketLinkageLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveItsmConnectorsFindingTicketPeerLink(
  currentSurfaceId: ItsmConnectorsFindingTicketSurfaceId,
): ItsmConnectorsFindingTicketLink {
  if (currentSurfaceId === "itsm-connectors") {
    return ITSM_CONNECTORS_FINDING_TICKET_FINDINGS_PEER_LINK;
  }

  return ITSM_CONNECTORS_FINDING_TICKET_CONNECTORS_LINK;
}
