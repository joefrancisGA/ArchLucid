import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_SETUP_CONFIG_HUBS_ALERT_RULES_LINK,
  GOVERNANCE_SETUP_CONFIG_HUBS_COMPACT_LINE,
  GOVERNANCE_SETUP_CONFIG_HUBS_HEADING,
  GOVERNANCE_SETUP_CONFIG_HUBS_POLICY_PACKS_LINK,
  GOVERNANCE_SETUP_CONFIG_HUBS_SETUP_LINK,
  GOVERNANCE_SETUP_CONFIG_HUBS_STANDARDS_LINK,
  GOVERNANCE_SETUP_CONFIG_HUBS_WHY_SEPARATE,
  buildGovernanceSetupConfigHubsVocabulary,
  resolveGovernanceSetupConfigHubsPeerLinks,
} from "@/lib/vocabulary/governance-setup-config-hubs-vocabulary";
import { GOVERNANCE_SETUP_HREF } from "@/lib/governance-setup-route";

describe("governance-setup-config-hubs-vocabulary (TB-2297)", () => {
  it("explains setup guide vs live config hubs", () => {
    const model = buildGovernanceSetupConfigHubsVocabulary();

    expect(model.heading).toBe(GOVERNANCE_SETUP_CONFIG_HUBS_HEADING);
    expect(model.whySeparate).toBe(GOVERNANCE_SETUP_CONFIG_HUBS_WHY_SEPARATE);
    expect(model.whySeparate.toLowerCase()).toContain("readiness checklist");
    expect(model.whySeparate.toLowerCase()).toContain("live");
    expect(model.compactLine).toBe(GOVERNANCE_SETUP_CONFIG_HUBS_COMPACT_LINE);
    expect(model.setupLink.href).toBe(GOVERNANCE_SETUP_HREF);
  });

  it("resolves peers with setup first when on a live hub", () => {
    const peers = resolveGovernanceSetupConfigHubsPeerLinks("alert-rules");

    expect(peers[0]).toEqual(GOVERNANCE_SETUP_CONFIG_HUBS_SETUP_LINK);
    expect(peers).toContainEqual(GOVERNANCE_SETUP_CONFIG_HUBS_POLICY_PACKS_LINK);
    expect(peers).toContainEqual(GOVERNANCE_SETUP_CONFIG_HUBS_STANDARDS_LINK);
    expect(peers).not.toContainEqual(GOVERNANCE_SETUP_CONFIG_HUBS_ALERT_RULES_LINK);
  });

  it("resolves all three hubs when on setup", () => {
    expect(resolveGovernanceSetupConfigHubsPeerLinks("setup")).toEqual([
      GOVERNANCE_SETUP_CONFIG_HUBS_ALERT_RULES_LINK,
      GOVERNANCE_SETUP_CONFIG_HUBS_POLICY_PACKS_LINK,
      GOVERNANCE_SETUP_CONFIG_HUBS_STANDARDS_LINK,
    ]);
  });
});
