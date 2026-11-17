import { describe, expect, it } from "vitest";

import { applySecondRunPasteToWizard, buildWizardDefaultsForSecondRunPaste, normalizeEnvironmentForWizard } from "./second-run-paste";

describe("second-run-paste", () => {
  it("parses TOML and maps datastore lines plus capabilities", () => {
    const toml = `
name = "Acme.Api"
description = "Handles orders with at least ten chars."
components = ["api", "worker"]
data_stores = ["Cosmos"]
public_endpoints = ["https://api.acme.test"]
compliance_posture = ["SOC2"]
environment = "prod"
`;
    const defaults = buildWizardDefaultsForSecondRunPaste();
    const result = applySecondRunPasteToWizard(toml, defaults);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.values.systemName).toBe("Acme.Api");
    expect(result.values.requiredCapabilities).toEqual(["api", "worker"]);
    expect(result.values.inlineRequirements).toContain("Datastore: Cosmos");
    expect(result.values.inlineRequirements).toContain("Public endpoint: https://api.acme.test");
    expect(result.values.securityBaselineHints).toEqual(["SOC2"]);
    expect(result.values.environment).toBe("production");
  });

  it("parses JSON and rejects short description", () => {
    const defaults = buildWizardDefaultsForSecondRunPaste();
    const bad = applySecondRunPasteToWizard('{"name":"x","description":"short"}', defaults);
    expect(bad.ok).toBe(false);
  });

  it("parses cloud_provider from TOML without forcing Azure", () => {
    const toml = `
name = "Acme.Api"
description = "Handles orders with at least ten chars."
cloud_provider = "aws"
environment = "prod"
`;
    const defaults = buildWizardDefaultsForSecondRunPaste();
    const result = applySecondRunPasteToWizard(toml, defaults);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.values.cloudProvider).toBe("Aws");
  });

  it("normalizeEnvironmentForWizard maps prod to production", () => {
    expect(normalizeEnvironmentForWizard("prod")).toBe("production");
  });

  it("does not default missing environment to staging on paste", () => {
    const toml = `
name = "Acme.Api"
description = "Handles orders with at least ten chars."
components = ["api"]
`;
    const defaults = { ...buildWizardDefaultsForSecondRunPaste(), environment: "production" };
    const result = applySecondRunPasteToWizard(toml, defaults);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.values.environment).toBe("production");
  });

  it("rejects unrecognized cloud_provider values instead of defaulting to Azure", () => {
    const toml = `
name = "Acme.Api"
description = "Handles orders with at least ten chars."
cloud_provider = "oracle"
`;
    const result = applySecondRunPasteToWizard(toml, buildWizardDefaultsForSecondRunPaste());

    expect(result.ok).toBe(false);

    if (result.ok) {
      return;
    }

    expect(result.error).toContain("cloud_provider 'oracle' is not recognized.");
  });

  it("normalizeEnvironmentForWizard does not invent staging when omitted", () => {
    expect(normalizeEnvironmentForWizard(undefined)).toBe("");
    expect(normalizeEnvironmentForWizard("qa")).toBe("");
  });
});
