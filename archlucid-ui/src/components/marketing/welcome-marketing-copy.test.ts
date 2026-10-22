import { describe, expect, it } from "vitest";

import {
  WELCOME_HERO_DIFFERENTIATORS,
  WELCOME_HERO_PITCH,
  WELCOME_HERO_PITCH_BUYER,
  WELCOME_HERO_PITCH_OPERATOR,
  WELCOME_SEE_IT_CTA_LABEL,
  WELCOME_USE_CASE_CARDS,
  WELCOME_WORKFLOW_STEPS,
  WELCOME_DEFAULT_POLICY_PACK_BASELINE_NOTE,
} from "@/components/marketing/welcome-marketing-copy";
import { DEMO_WORKSPACE_B_RUN_ID } from "@/lib/demo-workspace-scope";
import { SEE_IT_PAGE_TITLE } from "@/lib/see-it-page-copy";

function wordCount(text: string): number {
  return text.split(/\s+/).filter((token) => token.length > 0).length;
}

describe("welcome-marketing-copy", () => {
  it("keeps above-the-fold differentiators scannable and free of unverifiable claims", () => {
    expect(WELCOME_HERO_DIFFERENTIATORS.length).toBeGreaterThanOrEqual(3);

    for (const line of WELCOME_HERO_DIFFERENTIATORS) {
      expect(wordCount(line)).toBeLessThanOrEqual(8);
      // Guard against social-proof language we cannot substantiate pre-first-customer.
      expect(line.toLowerCase()).not.toMatch(/customers?|trusted by|fortune|leading|award/);
    }
  });

  it("uses the shorter buyer hero pitch above the fold", () => {
    expect(WELCOME_HERO_PITCH).toBe(WELCOME_HERO_PITCH_BUYER);
    expect(WELCOME_HERO_PITCH_BUYER.length).toBeLessThan(WELCOME_HERO_PITCH_OPERATOR.length);
  });

  it("keeps workflow step summaries short enough to scan as a timeline", () => {
    for (const step of WELCOME_WORKFLOW_STEPS) {
      expect(wordCount(step.summary)).toBeLessThanOrEqual(9);
    }
  });

  it("TB-1298: see-it CTA label avoids bare 30-second time claim", () => {
    expect(WELCOME_SEE_IT_CTA_LABEL.toLowerCase()).not.toMatch(/30\s*seconds?/);
    expect(WELCOME_SEE_IT_CTA_LABEL.toLowerCase()).not.toMatch(/\(30s\)/);
    expect(WELCOME_SEE_IT_CTA_LABEL).toMatch(/sample review/i);
    expect(WELCOME_SEE_IT_CTA_LABEL).toBe(SEE_IT_PAGE_TITLE);
  });

  it("TB-769: use-case cards present AWS and Google Cloud framework peers", () => {
    const titles = WELCOME_USE_CASE_CARDS.map((card) => card.title);

    expect(titles).toContain("AWS Well-Architected Framework");
    expect(titles).toContain("Google Cloud Architecture Framework");
    expect(titles.filter((title) => title.startsWith("Azure"))).toHaveLength(0);
  });

  it("TB-779: discloses Azure-default policy pack baseline on new workspaces", () => {
    expect(WELCOME_DEFAULT_POLICY_PACK_BASELINE_NOTE).toMatch(/cloud-neutral security and FinOps packs/i);
    expect(WELCOME_DEFAULT_POLICY_PACK_BASELINE_NOTE).toMatch(/Azure Well-Architected and CIS Azure packs/i);
    expect(WELCOME_DEFAULT_POLICY_PACK_BASELINE_NOTE).toMatch(/target AWS or Google Cloud in a review/i);
  });

  it("M-09 C8: AI governance card routes to Workspace B; framework cards stay on policy-pack docs", () => {
    const aiGovernance = WELCOME_USE_CASE_CARDS.find((card) => card.id === "ai-governance-security");
    const awsWaf = WELCOME_USE_CASE_CARDS.find((card) => card.id === "aws-waf");
    const gcp = WELCOME_USE_CASE_CARDS.find((card) => card.id === "gcp-architecture-framework");

    expect(aiGovernance?.href).toBe(`/architecture/reviews/${DEMO_WORKSPACE_B_RUN_ID}`);
    expect(awsWaf?.href).not.toContain(DEMO_WORKSPACE_B_RUN_ID);
    expect(gcp?.href).not.toContain(DEMO_WORKSPACE_B_RUN_ID);
    expect(awsWaf?.href).toMatch(/\/help\//);
    expect(gcp?.href).toMatch(/\/help\//);
  });
});
