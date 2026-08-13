import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { BUYER_START_ARCHITECTURE_REVIEW_CTA, CREATE_REVIEW_PACKAGE_HEADING } from "@/lib/buyer/buyer-polish-copy";
import { resolveFirstPilotOperatingRailStepsForDisplay } from "@/lib/first-pilot-operating-rail-copy";
import { APP_ROOT } from "@/lib/testing/repo-paths";

describe("review intake terminology", () => {
  it("uses Create review heading with Start architecture review CTA in operating-rail steps", () => {
    for (const buyerPolished of [false, true] as const) {
      const step = resolveFirstPilotOperatingRailStepsForDisplay(buyerPolished).find(
        (candidate) => candidate.id === "create-review",
      );

      expect(step?.title).toBe(CREATE_REVIEW_PACKAGE_HEADING);
      expect(step?.primaryLabel).toBe(BUYER_START_ARCHITECTURE_REVIEW_CTA);
    }
  });

  it("does not pair Create review section titles with Start review CTAs in intake wizards", () => {
    const reviewsNewDir = join(APP_ROOT, "(operator)", "architecture", "reviews", "new");
    const firstPilotSource = readFileSync(join(reviewsNewDir, "FirstPilotIntakeWizard.tsx"), "utf8");
    // Guided intake keeps its step titles in the step table beside the wizard, so both files carry
    // the copy this guard is about.
    const socraticSource = [
      readFileSync(join(reviewsNewDir, "SocraticIntakeWizard.tsx"), "utf8"),
      readFileSync(join(reviewsNewDir, "guided-intake-steps.ts"), "utf8"),
    ].join("\n");

    expect(firstPilotSource).toContain("CREATE_REVIEW_PACKAGE_HEADING");
    expect(firstPilotSource).toContain("BUYER_START_ARCHITECTURE_REVIEW_CTA");
    expect(firstPilotSource).not.toMatch(/Create review["']\s*[\s\S]{0,400}Start review/);
    expect(socraticSource).toContain("CREATE_REVIEW_PACKAGE_HEADING");
    expect(socraticSource).toContain("BUYER_START_ARCHITECTURE_REVIEW_CTA");
    expect(socraticSource).not.toMatch(/cardTitle:\s*"Start review"/);
  });

  it("uses Create architecture on home quick-action cards", () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "..", "components", "operator-home", "OperatorHomeGlossarySections.tsx"),
      "utf8",
    );

    expect(source).toContain("OPERATOR_START_REVIEW_QUICK_ACTION_LABEL");
    expect(source).not.toContain('"Create Request"');
    expect(source).not.toMatch(/Evidence intake/i);
  });

  it("uses outcome-first Alt+N shortcut label (TB-646)", () => {
    const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "shortcut-registry.ts"), "utf8");

    expect(source).toContain("BUYER_NEW_REVIEW_NAV_LABEL");
    expect(source).not.toContain('"New request"');
  });
});
