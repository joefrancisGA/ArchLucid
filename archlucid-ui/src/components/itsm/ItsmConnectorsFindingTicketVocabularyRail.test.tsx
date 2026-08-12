import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ItsmConnectorsFindingTicketVocabularyRail } from "@/components/itsm/ItsmConnectorsFindingTicketVocabularyRail";
import {
  ITSM_CONNECTORS_FINDING_TICKET_COMPACT_LINE,
  ITSM_CONNECTORS_FINDING_TICKET_CONNECTORS_LINK,
  ITSM_CONNECTORS_FINDING_TICKET_FINDINGS_PEER_LINK,
  ITSM_CONNECTORS_FINDING_TICKET_HEADING,
  ITSM_CONNECTORS_FINDING_TICKET_WHY_TWO,
} from "@/lib/vocabulary/itsm-connectors-finding-ticket-vocabulary";

describe("ItsmConnectorsFindingTicketVocabularyRail (TB-2310)", () => {
  it("renders itsm-connectors strip with Findings peer", () => {
    render(
      <ItsmConnectorsFindingTicketVocabularyRail currentSurfaceId="itsm-connectors" />,
    );

    const strip = screen.getByTestId("itsm-connectors-finding-ticket-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "itsm-connectors");
    expect(strip.textContent ?? "").toContain(ITSM_CONNECTORS_FINDING_TICKET_COMPACT_LINE);

    const peer = screen.getByTestId("itsm-connectors-finding-ticket-vocabulary-peer-link");
    expect(peer).toHaveTextContent(ITSM_CONNECTORS_FINDING_TICKET_FINDINGS_PEER_LINK.label);
    expect(peer).toHaveAttribute("href", ITSM_CONNECTORS_FINDING_TICKET_FINDINGS_PEER_LINK.href);
  });

  it("renders finding-ticket-linkage strip with ITSM connectors peer", () => {
    render(
      <ItsmConnectorsFindingTicketVocabularyRail currentSurfaceId="finding-ticket-linkage" />,
    );

    const peer = screen.getByTestId("itsm-connectors-finding-ticket-vocabulary-peer-link");
    expect(peer).toHaveTextContent(ITSM_CONNECTORS_FINDING_TICKET_CONNECTORS_LINK.label);
    expect(peer).toHaveAttribute("href", ITSM_CONNECTORS_FINDING_TICKET_CONNECTORS_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <ItsmConnectorsFindingTicketVocabularyRail
        currentSurfaceId="itsm-connectors"
        variant="full"
      />,
    );

    expect(screen.getByText(ITSM_CONNECTORS_FINDING_TICKET_HEADING)).toBeInTheDocument();
    expect(screen.getByText(ITSM_CONNECTORS_FINDING_TICKET_WHY_TWO)).toBeInTheDocument();
  });
});
