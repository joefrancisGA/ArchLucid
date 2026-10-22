import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ItsmConnectorsBuyerJiraServicenowVocabularyRail } from "@/components/itsm/ItsmConnectorsBuyerJiraServicenowVocabularyRail";
import {
  ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_COMPACT_LINE,
  ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_CONNECTORS_LINK,
  ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_HEADING,
  ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_JIRA_LINK,
  ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_SERVICENOW_LINK,
  ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_WHY_THREE,
} from "@/lib/vocabulary/itsm-connectors-buyer-jira-servicenow-vocabulary";

describe("ItsmConnectorsBuyerJiraServicenowVocabularyRail (TB-2324)", () => {
  it("renders itsm-connectors strip with peers to Jira and ServiceNow", () => {
    render(
      <ItsmConnectorsBuyerJiraServicenowVocabularyRail currentSurfaceId="itsm-connectors" />,
    );

    const strip = screen.getByTestId("itsm-connectors-buyer-jira-servicenow-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "itsm-connectors");
    expect(strip.textContent ?? "").toContain(ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_COMPACT_LINE);

    const jiraPeer = screen.getByTestId(
      "itsm-connectors-buyer-jira-servicenow-vocabulary-peer-jira",
    );
    expect(jiraPeer).toHaveTextContent(ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_JIRA_LINK.label);
    expect(jiraPeer).toHaveAttribute("href", ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_JIRA_LINK.href);

    const serviceNowPeer = screen.getByTestId(
      "itsm-connectors-buyer-jira-servicenow-vocabulary-peer-servicenow",
    );
    expect(serviceNowPeer).toHaveTextContent(
      ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_SERVICENOW_LINK.label,
    );
    expect(serviceNowPeer).toHaveAttribute(
      "href",
      ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_SERVICENOW_LINK.href,
    );
  });

  it("renders jira strip with peers to ITSM connectors and ServiceNow", () => {
    render(<ItsmConnectorsBuyerJiraServicenowVocabularyRail currentSurfaceId="jira" />);

    const connectorsPeer = screen.getByTestId(
      "itsm-connectors-buyer-jira-servicenow-vocabulary-peer-itsm-connectors",
    );
    expect(connectorsPeer).toHaveTextContent(
      ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_CONNECTORS_LINK.label,
    );
    expect(connectorsPeer).toHaveAttribute(
      "href",
      ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_CONNECTORS_LINK.href,
    );
  });

  it("renders full variant with why-three explanation", () => {
    render(
      <ItsmConnectorsBuyerJiraServicenowVocabularyRail
        currentSurfaceId="servicenow"
        variant="full"
      />,
    );

    expect(screen.getByText(ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_HEADING)).toBeInTheDocument();
    expect(screen.getByText(ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_WHY_THREE)).toBeInTheDocument();
  });
});
