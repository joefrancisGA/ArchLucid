import { describe, expect, it } from "vitest";

import {
  ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_COMPACT_LINE,
  ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_CONNECTORS_LINK,
  ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_HEADING,
  ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_JIRA_LINK,
  ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_SERVICENOW_LINK,
  ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_WHY_THREE,
  buildItsmConnectorsBuyerJiraServicenowVocabulary,
  resolveItsmConnectorsBuyerJiraServicenowPeerLinks,
} from "@/lib/vocabulary/itsm-connectors-buyer-jira-servicenow-vocabulary";
import {
  INTEGRATIONS_JIRA_PATH,
  INTEGRATIONS_SERVICENOW_PATH,
} from "@/lib/integrations-nav-paths";
import { ITSM_CONNECTORS_ADMIN_PATH } from "@/lib/itsm/itsm-connectors-admin-scope";

describe("itsm-connectors-buyer-jira-servicenow-vocabulary (TB-2324)", () => {
  it("explains admin ITSM connectors vs buyer Jira vs buyer ServiceNow", () => {
    const model = buildItsmConnectorsBuyerJiraServicenowVocabulary();

    expect(model.heading).toBe(ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_HEADING);
    expect(model.whyThree).toBe(ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_WHY_THREE);
    expect(model.whyThree.toLowerCase()).toContain("credentials");
    expect(model.whyThree.toLowerCase()).toContain("health");
    expect(model.whyThree.toLowerCase()).toContain("buyer");
    expect(model.compactLine).toBe(ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_COMPACT_LINE);
    expect(model.itsmConnectorsLink.href).toBe(ITSM_CONNECTORS_ADMIN_PATH);
    expect(model.jiraLink.href).toBe(INTEGRATIONS_JIRA_PATH);
    expect(model.serviceNowLink.href).toBe(INTEGRATIONS_SERVICENOW_PATH);
  });

  it("resolves peers excluding the current surface", () => {
    expect(resolveItsmConnectorsBuyerJiraServicenowPeerLinks("itsm-connectors")).toEqual([
      ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_JIRA_LINK,
      ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_SERVICENOW_LINK,
    ]);

    expect(resolveItsmConnectorsBuyerJiraServicenowPeerLinks("jira")).toEqual([
      ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_CONNECTORS_LINK,
      ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_SERVICENOW_LINK,
    ]);

    expect(resolveItsmConnectorsBuyerJiraServicenowPeerLinks("servicenow")).toEqual([
      ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_CONNECTORS_LINK,
      ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_JIRA_LINK,
    ]);
  });
});
