import { describe, expect, it } from "vitest";

import {
  ITSM_CONNECTOR_PROVIDER_AZURE_BOARDS_LINK,
  ITSM_CONNECTOR_PROVIDER_COMPACT_LINE,
  ITSM_CONNECTOR_PROVIDER_HEADING,
  ITSM_CONNECTOR_PROVIDER_JIRA_LINK,
  ITSM_CONNECTOR_PROVIDER_LINKS,
  ITSM_CONNECTOR_PROVIDER_SERVICENOW_LINK,
  ITSM_CONNECTOR_PROVIDER_WHY_THREE,
  buildItsmConnectorProviderChooser,
  resolveItsmConnectorProviderCurrentLink,
  resolveItsmConnectorProviderPeerLinks,
} from "@/lib/itsm/itsm-connector-provider-chooser";
import {
  INTEGRATIONS_AZURE_BOARDS_PATH,
  INTEGRATIONS_JIRA_PATH,
  INTEGRATIONS_SERVICENOW_PATH,
} from "@/lib/integrations-nav-paths";

describe("itsm-connector-provider-chooser (TB-2256)", () => {
  it("explains three distinct connectors with when-to-use copy and deep links", () => {
    const model = buildItsmConnectorProviderChooser();

    expect(model.heading).toBe(ITSM_CONNECTOR_PROVIDER_HEADING);
    expect(model.heading.toLowerCase()).toContain("jira");
    expect(model.heading.toLowerCase()).toContain("servicenow");
    expect(model.heading.toLowerCase()).toContain("azure boards");
    expect(model.whyThree).toBe(ITSM_CONNECTOR_PROVIDER_WHY_THREE);
    expect(model.whyThree.toLowerCase()).toContain("credentials");
    expect(model.compactLine).toBe(ITSM_CONNECTOR_PROVIDER_COMPACT_LINE);

    expect(model.providers).toEqual(ITSM_CONNECTOR_PROVIDER_LINKS);
    expect(model.providers).toHaveLength(3);

    expect(model.jiraLink).toEqual(ITSM_CONNECTOR_PROVIDER_JIRA_LINK);
    expect(model.jiraLink.href).toBe(INTEGRATIONS_JIRA_PATH);
    expect(model.jiraLink.whenToUse.toLowerCase()).toContain("jira");

    expect(model.serviceNowLink).toEqual(ITSM_CONNECTOR_PROVIDER_SERVICENOW_LINK);
    expect(model.serviceNowLink.href).toBe(INTEGRATIONS_SERVICENOW_PATH);
    expect(model.serviceNowLink.whenToUse.toLowerCase()).toContain("servicenow");

    expect(model.azureBoardsLink).toEqual(ITSM_CONNECTOR_PROVIDER_AZURE_BOARDS_LINK);
    expect(model.azureBoardsLink.href).toBe(INTEGRATIONS_AZURE_BOARDS_PATH);
    expect(model.azureBoardsLink.whenToUse.toLowerCase()).toContain("azure");
  });

  it("resolves peer connectors excluding the current provider", () => {
    expect(resolveItsmConnectorProviderPeerLinks("jira")).toEqual([
      ITSM_CONNECTOR_PROVIDER_SERVICENOW_LINK,
      ITSM_CONNECTOR_PROVIDER_AZURE_BOARDS_LINK,
    ]);

    expect(resolveItsmConnectorProviderPeerLinks("servicenow")).toEqual([
      ITSM_CONNECTOR_PROVIDER_JIRA_LINK,
      ITSM_CONNECTOR_PROVIDER_AZURE_BOARDS_LINK,
    ]);

    expect(resolveItsmConnectorProviderPeerLinks("azure-boards")).toEqual([
      ITSM_CONNECTOR_PROVIDER_JIRA_LINK,
      ITSM_CONNECTOR_PROVIDER_SERVICENOW_LINK,
    ]);
  });

  it("resolves the current provider link", () => {
    expect(resolveItsmConnectorProviderCurrentLink("jira")).toEqual(
      ITSM_CONNECTOR_PROVIDER_JIRA_LINK,
    );
    expect(resolveItsmConnectorProviderCurrentLink("servicenow")).toEqual(
      ITSM_CONNECTOR_PROVIDER_SERVICENOW_LINK,
    );
    expect(resolveItsmConnectorProviderCurrentLink("azure-boards")).toEqual(
      ITSM_CONNECTOR_PROVIDER_AZURE_BOARDS_LINK,
    );
  });
});
