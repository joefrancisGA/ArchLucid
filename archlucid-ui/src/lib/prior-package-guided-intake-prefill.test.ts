import { describe, expect, it } from "vitest";

import { derivePriorPackageGuidedIntakePrefill } from "@/lib/prior-package-guided-intake-prefill";

const GENERATED_BRIEF = [
  'Architecture review intake for "ArchLucid".',
  "Evaluate the attached materials for architecture structure, cost, compliance, security, and policy-pack violations.",
  "Treat each upload as architecture evidence unless a more specific category was supplied.",
].join(" ") + "\n\nAttached files:\n- ARCHITECTURE_HANDBOOK.2026.08.06b.docx";

describe("derivePriorPackageGuidedIntakePrefill", () => {
  it("maps a generated quick-start brief onto guided-intake fields", () => {
    const prefill = derivePriorPackageGuidedIntakePrefill({
      systemName: "ArchLucid",
      description: GENERATED_BRIEF,
      draftActors: [],
      inlineRequirements: [],
    });

    expect(prefill).not.toBeNull();
    expect(prefill?.systemName).toBe("ArchLucid");
    expect(prefill?.freeTextIntent).toContain('Architecture review intake for "ArchLucid".');
    expect(prefill?.freeTextIntent).not.toContain("Attached files:");
    expect(prefill?.priorAttachedFileNames).toEqual(["ARCHITECTURE_HANDBOOK.2026.08.06b.docx"]);
    expect(prefill?.businessOutcome).toContain("Evaluate the attached materials");
    expect(prefill?.actorSet.actors.length).toBeGreaterThan(0);
    expect(prefill?.scopeGateOpen).toBe(true);
    expect(prefill?.scopeBullets.some((bullet) => bullet.value.includes("ArchLucid"))).toBe(true);
  });

  it("splits draft-intake description and business outcome", () => {
    const prefill = derivePriorPackageGuidedIntakePrefill({
      systemName: "Vertex",
      description:
        "Vertex tenant migration with private networking and EU residency goals.\n\nBusiness outcome: Faster onboarding for regulated tenants.",
      draftActors: [
        {
          label: "Primary operator",
          kind: "Human",
          trustOrigin: "Internal",
          contract: "Sync",
          origin: "Asserted",
          confidence: 100,
        },
      ],
    });

    expect(prefill).not.toBeNull();
    expect(prefill?.systemName).toBe("Vertex");
    expect(prefill?.freeTextIntent).toBe(
      "Vertex tenant migration with private networking and EU residency goals.",
    );
    expect(prefill?.businessOutcome).toBe("Faster onboarding for regulated tenants.");
    expect(prefill?.actorSet.actors).toHaveLength(1);
  });

  it("rehydrates operator-confirmed scope lines from the prior brief", () => {
    const prefill = derivePriorPackageGuidedIntakePrefill({
      systemName: "ArchLucid",
      description: [
        'Architecture review intake for "ArchLucid".',
        "Evaluate the attached materials for architecture structure, cost, compliance, security, and policy-pack violations.",
        "",
        "Operator-confirmed in-scope understanding:",
        "- Primary System or Architecture: ArchLucid",
      ].join("\n"),
      draftActors: [],
    });

    expect(prefill).not.toBeNull();
    expect(prefill?.scopeBullets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Primary System or Architecture",
          value: "ArchLucid",
        }),
      ]),
    );
  });

  it("returns null when the request has no description", () => {
    expect(
      derivePriorPackageGuidedIntakePrefill({
        systemName: "ArchLucid",
        description: "",
      }),
    ).toBeNull();
  });
});
