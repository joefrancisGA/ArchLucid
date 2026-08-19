import { describe, expect, it } from "vitest";

import {
  DEVELOPER_API_CONTRACTS_API_KEYS_API_CONTRACTS_LINK,
  DEVELOPER_API_CONTRACTS_API_KEYS_API_KEYS_LINK,
  DEVELOPER_API_CONTRACTS_API_KEYS_COMPACT_LINE,
  DEVELOPER_API_CONTRACTS_API_KEYS_DEVELOPER_LINK,
  DEVELOPER_API_CONTRACTS_API_KEYS_HEADING,
  DEVELOPER_API_CONTRACTS_API_KEYS_WHY_THREE,
  buildDeveloperApiContractsApiKeysVocabulary,
  resolveDeveloperApiContractsApiKeysLink,
  resolveDeveloperApiContractsApiKeysPeerLinks,
} from "@/lib/vocabulary/developer-api-contracts-api-keys-vocabulary";
import { API_CONTRACTS_HELP_PATH } from "@/lib/api-contracts-help-route";
import { API_KEYS_SETTINGS_CANONICAL_PATH } from "@/lib/api-keys-settings-evidence-copy";
import { CLI_USAGE_HELP_PATH } from "@/lib/cli-usage-help-route";
import { DEVELOPER_SETTINGS_CANONICAL_PATH } from "@/lib/developer-settings-evidence-copy";

describe("developer-api-contracts-api-keys-vocabulary (TB-2270)", () => {
  it("explains the developer / API contracts / API keys triad", () => {
    const model = buildDeveloperApiContractsApiKeysVocabulary();

    expect(model.heading).toBe(DEVELOPER_API_CONTRACTS_API_KEYS_HEADING);
    expect(model.whyThree).toBe(DEVELOPER_API_CONTRACTS_API_KEYS_WHY_THREE);
    expect(model.whyThree.toLowerCase()).toContain("developer");
    expect(model.whyThree.toLowerCase()).toContain("contract");
    expect(model.whyThree.toLowerCase()).toContain("credential");
    expect(model.compactLine).toBe(DEVELOPER_API_CONTRACTS_API_KEYS_COMPACT_LINE);

    expect(model.developerLink).toEqual(DEVELOPER_API_CONTRACTS_API_KEYS_DEVELOPER_LINK);
    expect(model.developerLink.href).toBe(DEVELOPER_SETTINGS_CANONICAL_PATH);
    expect(model.developerLink.href).toBe("/administration/developer");

    expect(model.apiContractsLink).toEqual(DEVELOPER_API_CONTRACTS_API_KEYS_API_CONTRACTS_LINK);
    expect(model.apiContractsLink.href).toBe(API_CONTRACTS_HELP_PATH);
    expect(model.apiContractsLink.href).toBe("/help/api-contracts");

    expect(model.apiKeysLink).toEqual(DEVELOPER_API_CONTRACTS_API_KEYS_API_KEYS_LINK);
    expect(model.apiKeysLink.href).toBe(API_KEYS_SETTINGS_CANONICAL_PATH);
    expect(model.apiKeysLink.href).toBe(CLI_USAGE_HELP_PATH);
  });

  it("resolves current and peer links for each surface", () => {
    expect(resolveDeveloperApiContractsApiKeysLink("developer")).toEqual(
      DEVELOPER_API_CONTRACTS_API_KEYS_DEVELOPER_LINK,
    );
    expect(resolveDeveloperApiContractsApiKeysLink("api-contracts")).toEqual(
      DEVELOPER_API_CONTRACTS_API_KEYS_API_CONTRACTS_LINK,
    );
    expect(resolveDeveloperApiContractsApiKeysLink("api-keys")).toEqual(
      DEVELOPER_API_CONTRACTS_API_KEYS_API_KEYS_LINK,
    );

    expect(resolveDeveloperApiContractsApiKeysPeerLinks("developer")).toEqual([
      DEVELOPER_API_CONTRACTS_API_KEYS_API_CONTRACTS_LINK,
      DEVELOPER_API_CONTRACTS_API_KEYS_API_KEYS_LINK,
    ]);
    expect(resolveDeveloperApiContractsApiKeysPeerLinks("api-contracts")).toEqual([
      DEVELOPER_API_CONTRACTS_API_KEYS_DEVELOPER_LINK,
      DEVELOPER_API_CONTRACTS_API_KEYS_API_KEYS_LINK,
    ]);
    expect(resolveDeveloperApiContractsApiKeysPeerLinks("api-keys")).toEqual([
      DEVELOPER_API_CONTRACTS_API_KEYS_DEVELOPER_LINK,
      DEVELOPER_API_CONTRACTS_API_KEYS_API_CONTRACTS_LINK,
    ]);
  });
});
