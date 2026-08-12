import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ItsmConnectorProviderChooserRail } from "@/components/ItsmConnectorProviderChooserRail";
import {
  ITSM_CONNECTOR_PROVIDER_AZURE_BOARDS_LINK,
  ITSM_CONNECTOR_PROVIDER_COMPACT_LINE,
  ITSM_CONNECTOR_PROVIDER_HEADING,
  ITSM_CONNECTOR_PROVIDER_JIRA_LINK,
  ITSM_CONNECTOR_PROVIDER_SERVICENOW_LINK,
  ITSM_CONNECTOR_PROVIDER_WHY_THREE,
} from "@/lib/itsm/itsm-connector-provider-chooser";

describe("ItsmConnectorProviderChooserRail (TB-2256)", () => {
  it("from Jira links ServiceNow and Azure Boards", () => {
    render(<ItsmConnectorProviderChooserRail currentProviderId="jira" />);

    const strip = screen.getByTestId("itsm-connector-provider-chooser");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-provider", "jira");
    expect(strip.textContent ?? "").toContain(ITSM_CONNECTOR_PROVIDER_COMPACT_LINE);

    const snow = screen.getByTestId("itsm-connector-provider-chooser-peer-servicenow");
    expect(snow).toHaveTextContent(ITSM_CONNECTOR_PROVIDER_SERVICENOW_LINK.label);
    expect(snow).toHaveAttribute("href", ITSM_CONNECTOR_PROVIDER_SERVICENOW_LINK.href);

    const boards = screen.getByTestId("itsm-connector-provider-chooser-peer-azure-boards");
    expect(boards).toHaveTextContent(ITSM_CONNECTOR_PROVIDER_AZURE_BOARDS_LINK.label);
    expect(boards).toHaveAttribute("href", ITSM_CONNECTOR_PROVIDER_AZURE_BOARDS_LINK.href);
  });

  it("from ServiceNow links Jira and Azure Boards", () => {
    render(<ItsmConnectorProviderChooserRail currentProviderId="servicenow" />);

    expect(screen.getByTestId("itsm-connector-provider-chooser-peer-jira")).toHaveAttribute(
      "href",
      ITSM_CONNECTOR_PROVIDER_JIRA_LINK.href,
    );
    expect(
      screen.getByTestId("itsm-connector-provider-chooser-peer-azure-boards"),
    ).toHaveAttribute("href", ITSM_CONNECTOR_PROVIDER_AZURE_BOARDS_LINK.href);
  });

  it("from Azure Boards links Jira and ServiceNow", () => {
    render(<ItsmConnectorProviderChooserRail currentProviderId="azure-boards" />);

    expect(screen.getByTestId("itsm-connector-provider-chooser-peer-jira")).toHaveAttribute(
      "href",
      ITSM_CONNECTOR_PROVIDER_JIRA_LINK.href,
    );
    expect(screen.getByTestId("itsm-connector-provider-chooser-peer-servicenow")).toHaveAttribute(
      "href",
      ITSM_CONNECTOR_PROVIDER_SERVICENOW_LINK.href,
    );
  });

  it("renders full variant with when-to-use lines for each provider", () => {
    render(<ItsmConnectorProviderChooserRail currentProviderId="jira" variant="full" />);

    const strip = screen.getByTestId("itsm-connector-provider-chooser");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(ITSM_CONNECTOR_PROVIDER_HEADING)).toBeInTheDocument();
    expect(screen.getByText(ITSM_CONNECTOR_PROVIDER_WHY_THREE)).toBeInTheDocument();
    expect(screen.getByTestId("itsm-connector-provider-chooser-current")).toHaveTextContent(
      ITSM_CONNECTOR_PROVIDER_JIRA_LINK.label,
    );
    expect(screen.getByText(ITSM_CONNECTOR_PROVIDER_JIRA_LINK.whenToUse)).toBeInTheDocument();
    expect(screen.getByText(ITSM_CONNECTOR_PROVIDER_SERVICENOW_LINK.whenToUse)).toBeInTheDocument();
    expect(
      screen.getByText(ITSM_CONNECTOR_PROVIDER_AZURE_BOARDS_LINK.whenToUse),
    ).toBeInTheDocument();
  });
});
