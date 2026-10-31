import { describe, expect, it } from "vitest";

import {
  deriveReviewSubmittedIntakeRecap,
  RECAP_FIELD_PREVIEW_TRUNCATION_NOTE,
} from "./derive-review-submitted-intake-recap";

const GENERATED_BRIEF = [
  'Architecture review intake for "ArchLucid".',
  "Evaluate the attached materials for architecture structure, cost, compliance, security, and policy-pack violations.",
  "Treat each upload as architecture evidence unless a more specific category was supplied.",
  "",
  "Attached files:",
  "- ARCHITECTURE_HANDBOOK.2026.08.06b.docx",
  "",
  "Operator-confirmed in-scope understanding:",
  "- Primary System or Architecture: ArchLucid",
].join("\n");

describe("deriveReviewSubmittedIntakeRecap", () => {
  it("maps a generated intake brief into structured recap fields", () => {
    const recap = deriveReviewSubmittedIntakeRecap({ description: GENERATED_BRIEF });

    expect(recap).not.toBeNull();
    expect(recap?.fields).toEqual(
      expect.arrayContaining([
        { label: "Review title", value: "ArchLucid" },
        {
          label: "Evaluation directive",
          value:
            "Evaluate the attached materials for architecture structure, cost, compliance, security, and policy-pack violations.",
        },
      ]),
    );
    expect(recap?.fields.some((field) => field.label === "Primary System or Architecture")).toBe(false);
    expect(recap?.attachedFiles).toEqual(["ARCHITECTURE_HANDBOOK.2026.08.06b.docx"]);
  });

  it("returns honest copy when intake description is missing or empty", () => {
    expect(deriveReviewSubmittedIntakeRecap({ description: null })?.fields).toEqual([
      { label: "Intake description", value: "Intake description was not stored." },
    ]);
    expect(deriveReviewSubmittedIntakeRecap({ description: "   " })?.fields).toEqual([
      { label: "Intake description", value: "Intake description was stored empty." },
    ]);
  });

  it("labels generated brief without business outcome marker", () => {
    const recap = deriveReviewSubmittedIntakeRecap({ description: GENERATED_BRIEF });

    expect(recap?.fields).toEqual(
      expect.arrayContaining([
        { label: "Business Outcome", value: "Business outcome was not stored." },
      ]),
    );
  });

  it("notes when a recap field preview is truncated (P-20)", () => {
    const longBrief = "z".repeat(500);
    const recap = deriveReviewSubmittedIntakeRecap({
      description: longBrief,
      systemName: "Edge",
    });

    const briefField = recap?.fields.find((field) => field.label === "Architecture brief");

    expect(briefField?.value).toContain(RECAP_FIELD_PREVIEW_TRUNCATION_NOTE);
    expect(briefField?.value.length).toBeLessThan(longBrief.length);
  });

  it("labels empty in-scope section on generated briefs", () => {
    const brief = [
      'Architecture review intake for "Edge".',
      "Evaluate the attached materials for architecture structure.",
      "",
      "Operator-confirmed in-scope understanding:",
    ].join("\n");

    const recap = deriveReviewSubmittedIntakeRecap({ description: brief });

    expect(recap?.fields).toEqual(
      expect.arrayContaining([
        { label: "In-scope understanding", value: "In-scope understanding was stored empty." },
      ]),
    );
  });

  it("includes operator-authored brief text for non-generated descriptions", () => {
    const recap = deriveReviewSubmittedIntakeRecap({
      description: "Payments edge modernization with private endpoints only.",
      systemName: "Payments edge",
    });

    expect(recap?.fields).toEqual(
      expect.arrayContaining([
        {
          label: "System name (review record)",
          value: "Payments edge",
        },
        {
          label: "Architecture brief",
          value: "Payments edge modernization with private endpoints only.",
        },
      ]),
    );
  });
});
