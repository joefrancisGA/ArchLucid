import { describe, expect, it } from "vitest";

import { emptyArchitectureDraftStructuredBrief } from "@/lib/architecture/architecture-draft-structured-brief";
import { buildGuidedIntakeClarificationInferenceCorpus } from "@/lib/guided-intake-clarification-inference-corpus";
import { inferUniversalIntakeAnswersFromCorpus } from "@/lib/universal-intake-answer-inference";

describe("buildGuidedIntakeClarificationInferenceCorpus", () => {
  it("includes overview, structured brief fields, actors, and operational owner", () => {
    const corpus = buildGuidedIntakeClarificationInferenceCorpus({
      architectureOverview:
        "Vertex is a multi-tenant SaaS platform on Azure with private networking and EU data residency.",
      systemName: "Vertex",
      businessOutcome: "Accelerate tenant onboarding while meeting compliance obligations.",
      structuredBrief: {
        ...emptyArchitectureDraftStructuredBrief(),
        confirmedConstraints: ["EU data residency required"],
        confirmedAssumptions: ["Entra ID is the identity provider"],
        confirmedRequiredCapabilities: ["Tenant isolation"],
        qualityAttribute: "99.9% availability; RPO 15 minutes",
        operationalOwner: "Platform SRE team",
        failureModeNote: "Regional outage fails over to paired region",
      },
      actorSet: {
        actors: [
          {
            label: "Tenant admin",
            kind: "Human",
            trustOrigin: "External",
            contract: "Sync",
            origin: "Asserted",
            confidence: 100,
          },
        ],
      },
    });

    expect(corpus).toContain("System name: Vertex");
    expect(corpus).toContain("Business outcome:");
    expect(corpus).toContain("Architecture overview:");
    expect(corpus).toContain("Confirmed constraints");
    expect(corpus).toContain("EU data residency required");
    expect(corpus).toContain("Operational owner: Platform SRE team");
    expect(corpus).toContain("Failure modes:");
    expect(corpus).toContain("Tenant admin");
  });

  it("omits unknown structured-brief sentinels and empty actor lists", () => {
    const corpus = buildGuidedIntakeClarificationInferenceCorpus({
      architectureOverview: "Short overview only.",
      structuredBrief: emptyArchitectureDraftStructuredBrief(),
      actorSet: { actors: [] },
    });

    expect(corpus).toContain("Architecture overview:");
    expect(corpus).not.toContain("Operational owner:");
    expect(corpus).not.toContain("Actors:");
  });

  it("supports inferring clarification answers from a saved-architecture style brief", () => {
    const corpus = buildGuidedIntakeClarificationInferenceCorpus({
      architectureOverview:
        "Vertex runs on Microsoft Azure with private endpoints, 99.9% availability, RPO 15 minutes, and PCI-scoped cardholder data.",
      systemName: "Vertex",
      businessOutcome: "Onboard enterprise tenants with EU data residency.",
      structuredBrief: {
        ...emptyArchitectureDraftStructuredBrief(),
        confirmedConstraints: ["EU data residency", "PCI DSS scope for payment metadata"],
        operationalOwner: "Platform SRE on-call",
      },
      actorSet: {
        actors: [
          {
            label: "Tenant administrator",
            kind: "Human",
            trustOrigin: "External",
            contract: "Sync",
            origin: "Asserted",
            confidence: 100,
          },
        ],
      },
    });

    const inferred = inferUniversalIntakeAnswersFromCorpus(corpus);

    expect(inferred["l0.pillar.cloud-target"] ?? inferred["l0.cloud-target"]).toBeDefined();
    expect(inferred["l0.pillar.security"]?.toLowerCase()).toMatch(/pci|cardholder|data/);
    expect(inferred["l0.pillar.reliability"]?.toLowerCase()).toMatch(/99\.9|rpo|availability/);
  });
});
