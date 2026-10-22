import { describe, expect, it } from "vitest";

import { buildArchitectureCreateRequest } from "@/lib/architecture/build-architecture-create-request";
import { wizardValuesToCreateRunPayload } from "@/lib/wizard-payload";
import type { WizardFormValues } from "@/lib/wizard-schema";

const baseValues: WizardFormValues = {
  requestId: "req-robustness-1",
  description: "Operator architecture context for a payment platform migration with multi-region failover.",
  systemName: "Payments",
  environment: "prod",
  cloudProvider: "Azure",
  constraints: ["Use managed identity"],
  requiredCapabilities: ["HA"],
  assumptions: ["Single tenant"],
  priorManifestVersion: "",
  inlineRequirements: [],
  documents: [],
  policyReferences: [],
  topologyHints: [],
  securityBaselineHints: [],
  infrastructureDeclarations: [],
};

describe("buildArchitectureCreateRequest", () => {
  it("matches wizardValuesToCreateRunPayload output", () => {
    const unified = buildArchitectureCreateRequest({ wizardValues: baseValues });
    const direct = wizardValuesToCreateRunPayload(baseValues);

    expect(unified).toEqual(direct);
  });
});
