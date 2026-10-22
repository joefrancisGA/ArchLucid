import { describe, expect, it } from "vitest";

import { ARCHITECTURE_REQUEST_DESCRIPTION_MAX_LENGTH } from "@/lib/architecture/architecture-request-limits";
import { wizardValuesToCreateRunPayload } from "@/lib/wizard-payload";
import { buildDefaultWizardValues, wizardFormSchema } from "@/lib/wizard-schema";

import {
  architectureReviewTemplates,
  suggestedSystemNameFromTemplateId,
} from "./review-templates";

const categories: Array<(typeof architectureReviewTemplates)[number]["category"]> = [
  "migration",
  "greenfield",
  "security",
  "compliance",
  "optimization",
];

describe("architectureReviewTemplates", () => {
  it("exports exactly five templates with required shape and word-count briefs", () => {
    expect(architectureReviewTemplates).toHaveLength(5);

    for (const t of architectureReviewTemplates) {
      expect(t.id.length).toBeGreaterThan(0);
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(10);
      expect(t.briefText.trim().length).toBeGreaterThanOrEqual(10);
      expect(t.briefText.length).toBeLessThanOrEqual(ARCHITECTURE_REQUEST_DESCRIPTION_MAX_LENGTH);
      expect(t.suggestedTitle.length).toBeGreaterThan(0);
      expect(categories).toContain(t.category);

      const words = t.briefText.trim().split(/\s+/).filter(Boolean).length;
      expect(words).toBeGreaterThanOrEqual(200);
      expect(words).toBeLessThanOrEqual(400);
    }
  });

  it("suggestedSystemNameFromTemplateId matches PascalCase segments from id", () => {
    expect(suggestedSystemNameFromTemplateId("cloud-migration-assessment")).toBe("CloudMigrationAssessment");
    expect(suggestedSystemNameFromTemplateId("a-b")).toBe("AB");
  });

  it("keeps template picker descriptions pattern-first without implying a default cloud provider", () => {
    for (const template of architectureReviewTemplates) {
      const normalized = template.description.toLowerCase();

      expect(normalized).not.toContain("accelerated v1");
      expect(normalized).not.toMatch(/\bdefault to azure\b/);
    }
  });

  it("each template merges into valid wizard values and create-run payload", () => {
    for (const t of architectureReviewTemplates) {
      const base = buildDefaultWizardValues();
      const merged = {
        ...base,
        description: t.briefText,
        systemName: suggestedSystemNameFromTemplateId(t.id),
      };

      const parsed = wizardFormSchema.parse(merged);
      const payload = wizardValuesToCreateRunPayload(parsed);

      expect(payload.description).toBe(t.briefText.trim());
      expect(payload.systemName).toBe(suggestedSystemNameFromTemplateId(t.id));
      expect(payload.requestId.length).toBeGreaterThanOrEqual(32);
      expect(payload.cloudProvider).toBe("None");
      expect(payload.environment.length).toBeGreaterThan(0);
    }
  });
});
