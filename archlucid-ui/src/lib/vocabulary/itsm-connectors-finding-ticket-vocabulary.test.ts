import { describe, expect, it } from "vitest";

import {
  ITSM_CONNECTORS_FINDING_TICKET_COMPACT_LINE,
  ITSM_CONNECTORS_FINDING_TICKET_CONNECTORS_LINK,
  ITSM_CONNECTORS_FINDING_TICKET_FINDINGS_PEER_LINK,
  ITSM_CONNECTORS_FINDING_TICKET_HEADING,
  ITSM_CONNECTORS_FINDING_TICKET_WHY_TWO,
  buildItsmConnectorsFindingTicketVocabulary,
  resolveItsmConnectorsFindingTicketPeerLink,
} from "@/lib/vocabulary/itsm-connectors-finding-ticket-vocabulary";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { ITSM_CONNECTORS_ADMIN_PATH } from "@/lib/itsm/itsm-connectors-admin-scope";

describe("itsm-connectors-finding-ticket-vocabulary (TB-2310)", () => {
  it("explains connector admin vs finding ticket linkage", () => {
    const model = buildItsmConnectorsFindingTicketVocabulary();

    expect(model.heading).toBe(ITSM_CONNECTORS_FINDING_TICKET_HEADING);
    expect(model.whyTwo).toBe(ITSM_CONNECTORS_FINDING_TICKET_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("credentials");
    expect(model.whyTwo.toLowerCase()).toContain("finding");
    expect(model.compactLine).toBe(ITSM_CONNECTORS_FINDING_TICKET_COMPACT_LINE);
    expect(model.itsmConnectorsLink.href).toBe(ITSM_CONNECTORS_ADMIN_PATH);
    expect(model.findingTicketLinkageLink.href).toBe(GOVERNANCE_FINDINGS_PATH);
  });

  it("resolves the peer surface from connectors and finding ticket linkage", () => {
    expect(resolveItsmConnectorsFindingTicketPeerLink("itsm-connectors")).toEqual(
      ITSM_CONNECTORS_FINDING_TICKET_FINDINGS_PEER_LINK,
    );

    expect(resolveItsmConnectorsFindingTicketPeerLink("finding-ticket-linkage")).toEqual(
      ITSM_CONNECTORS_FINDING_TICKET_CONNECTORS_LINK,
    );
  });
});
