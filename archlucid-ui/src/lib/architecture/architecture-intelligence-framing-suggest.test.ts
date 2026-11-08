import { describe, expect, it } from "vitest";

import { emptyArchitectureDraftStructuredBrief } from "@/lib/architecture/architecture-draft-structured-brief";
import { suggestFramingAnswersFromOverview } from "@/lib/architecture/architecture-intelligence-framing-suggest";
import { FRAMING_SUGGEST_INFERRED_FROM_BRIEF_PREFIX } from "@/lib/architecture/framing-suggest-infer";

describe("architecture-intelligence-framing-suggest", () => {
  it("infers business outcome from context when prose passes the buyer-safe gate", () => {
    const suggestions = suggestFramingAnswersFromOverview(
      [
        { questionId: "business-outcome", prompt: "Outcome?" },
        { questionId: "architecture-kind", prompt: "Kind?" },
      ],
      {
        combinedSourceText: "This is a migration from monolith to services.",
        businessOutcome: "Process claims faster with measurable SLAs.",
      },
    );

    expect(suggestions).toEqual({
      "business-outcome": `${FRAMING_SUGGEST_INFERRED_FROM_BRIEF_PREFIX}Process claims faster with measurable SLAs.`,
    });
  });

  it("does not promote confirmedAnswer fields as inferred overview suggestions", () => {
    const suggestions = suggestFramingAnswersFromOverview(
      [{ questionId: "fixed-decisions", prompt: "Fixed?", confirmedAnswer: "Azure-only deployment" }],
      {
        combinedSourceText: "Overview only",
      },
    );

    expect(suggestions).toEqual({});
  });

  it("uses confirmed constraints for fixed-decisions suggestions", () => {
    const brief = emptyArchitectureDraftStructuredBrief();
    const structuredBrief = {
      ...brief,
      confirmedConstraints: ["Azure-only deployment."],
    };

    const suggestions = suggestFramingAnswersFromOverview(
      [{ questionId: "fixed-decisions", prompt: "Fixed?" }],
      {
        combinedSourceText: "Overview only",
        structuredBrief,
      },
    );

    expect(suggestions).toEqual({
      "fixed-decisions": `${FRAMING_SUGGEST_INFERRED_FROM_BRIEF_PREFIX}Azure-only deployment.`,
    });
  });

  it("fills multiple framing questions from structured brief and overview sections", () => {
    const brief = emptyArchitectureDraftStructuredBrief();
    const structuredBrief = {
      ...brief,
      confirmedConstraints: ["Shared DB with TenantId.", "Async billing metering."],
      confirmedRequiredCapabilities: ["Migration tool runs with elevated database permissions."],
      qualityAttribute: "Availability 99.9%; RPO 15 minutes",
      failureModeNote: "Tenant data loss during migration is unacceptable; rollback must be manual.",
    };

    const overview = [
      "# Architecture Review Packet: B2B SaaS Tenant Migration Platform",
      "## Scope",
      "In scope: tenant migration orchestration, billing metering hooks, and admin impersonation for pilot tenants.",
      "Out of scope: customer-facing B2C identity and third-party FinOps tooling.",
      "## Failure mode and recovery",
      "Manual rollback is required when migration validation fails.",
    ].join("\n");

    const suggestions = suggestFramingAnswersFromOverview(
      [
        { questionId: "system-boundary", prompt: "What is inside and outside the system boundary?" },
        { questionId: "fixed-decisions", prompt: "Which decisions are already fixed and non-negotiable?" },
        { questionId: "critical-quality-attributes", prompt: "Which quality attributes are critical for success?" },
        { questionId: "unacceptable-failures", prompt: "What failures are unacceptable?" },
        {
          questionId: "evidence-1",
          prompt: "Provide evidence for: Recovery objective adequacy cannot be verified",
          source: "EvidenceDriven",
        },
        {
          questionId: "evidence-2",
          prompt: "Provide evidence for: Cost drivers are missing",
          source: "EvidenceDriven",
        },
      ],
      {
        combinedSourceText: overview,
        businessOutcome: "Migrate pilot tenants without billing disruption.",
        structuredBrief,
      },
    );

    expect(suggestions["fixed-decisions"]).toBe(
      `${FRAMING_SUGGEST_INFERRED_FROM_BRIEF_PREFIX}Shared DB with TenantId.; Async billing metering.`,
    );
    expect(suggestions["critical-quality-attributes"]).toBe(
      `${FRAMING_SUGGEST_INFERRED_FROM_BRIEF_PREFIX}Availability 99.9%; RPO 15 minutes`,
    );
    expect(suggestions["unacceptable-failures"]).toContain("Tenant data loss");
    expect(suggestions["system-boundary"]).toMatch(/tenant migration orchestration/i);
    expect(suggestions["evidence-1"]).toMatch(/RPO 15 minutes/i);
    expect(suggestions["evidence-2"]).toBeUndefined();
  });

  it("infers evidence-driven answers from overview when server inferredAnswer is only the finding title", () => {
    const suggestions = suggestFramingAnswersFromOverview(
      [
        {
          questionId: "evidence-1",
          prompt: "Provide evidence for: Recovery objective adequacy cannot be verified",
          inferredAnswer: "No recovery objective documented.",
          source: "EvidenceDriven",
        },
      ],
      {
        combinedSourceText: "Availability target is 99.9% with RPO 15 minutes and RTO 1 hour for pilot tenants.",
      },
    );

    expect(suggestions["evidence-1"]).toMatch(/RPO 15 minutes/i);
    expect(suggestions["evidence-1"]).toMatch(/RTO 1 hour/i);
  });
});
