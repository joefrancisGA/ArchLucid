import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { BUYER_START_ARCHITECTURE_REVIEW_CTA, CREATE_REVIEW_PACKAGE_HEADING } from "@/lib/buyer-polish-copy";
import { resolveFirstPilotOperatingRailStepsForDisplay } from "@/lib/first-pilot-operating-rail-copy";

describe("review intake terminology", () => {
  it("uses Create review package heading with Start architecture review CTA in operating-rail steps", () => {
    for (const buyerPolished of [false, true] as const) {
      const step = resolveFirstPilotOperatingRailStepsForDisplay(buyerPolished).find(
        (candidate) => candidate.id === "create-review",
      );

      expect(step?.title).toBe(CREATE_REVIEW_PACKAGE_HEADING);
      expect(step?.primaryLabel).toBe(BUYER_START_ARCHITECTURE_REVIEW_CTA);
    }
  });

  it("does not pair Create review section titles with Start review CTAs in intake wizards", () => {
    const reviewsNewDir = join(dirname(fileURLToPath(import.meta.url)), "..", "app", "(operator)", "reviews", "new");
    const firstPilotSource = readFileSync(join(reviewsNewDir, "FirstPilotIntakeWizard.tsx"), "utf8");
    const socraticSource = readFileSync(join(reviewsNewDir, "SocraticIntakeWizard.tsx"), "utf8");

    expect(firstPilotSource).toContain("CREATE_REVIEW_PACKAGE_HEADING");
    expect(firstPilotSource).toContain("BUYER_START_ARCHITECTURE_REVIEW_CTA");
    expect(firstPilotSource).not.toMatch(/Create review["']\s*[\s\S]{0,400}Start review/);
    expect(socraticSource).toContain("CREATE_REVIEW_PACKAGE_HEADING");
    expect(socraticSource).toContain("BUYER_START_ARCHITECTURE_REVIEW_CTA");
    expect(socraticSource).not.toMatch(/cardTitle:\s*"Start review"/);
  });
});
