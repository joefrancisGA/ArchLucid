import { describe, expect, it } from "vitest";

import { deriveReviewSubmittedIntakeRecap } from "./derive-review-submitted-intake-recap";

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

  it("returns null when no description is available", () => {
    expect(deriveReviewSubmittedIntakeRecap({ description: null })).toBeNull();
    expect(deriveReviewSubmittedIntakeRecap({ description: "   " })).toBeNull();
  });

  it("includes operator-authored brief text for non-generated descriptions", () => {
    const recap = deriveReviewSubmittedIntakeRecap({
      description: "Payments edge modernization with private endpoints only.",
      systemName: "Payments edge",
    });

    expect(recap?.fields).toEqual(
      expect.arrayContaining([
        { label: "Review title", value: "Payments edge" },
        {
          label: "Architecture brief",
          value: "Payments edge modernization with private endpoints only.",
        },
      ]),
    );
  });
});
