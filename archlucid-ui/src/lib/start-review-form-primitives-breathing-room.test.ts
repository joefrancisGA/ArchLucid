import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("start review shared form primitives breathing room (TB-2002)", () => {
  it("uses TB-2000 stack tokens in shared path switcher and wizard hint sources", () => {
    const pathSwitcher = readFileSync(
      join(process.cwd(), "src", "app", "(operator)", "architecture", "reviews", "new", "ReviewsNewPathSwitcher.tsx"),
      "utf8",
    );
    const wizardFieldHint = readFileSync(
      join(process.cwd(), "src", "components", "wizard", "WizardFieldHint.tsx"),
      "utf8",
    );
    const pilotToggle = readFileSync(
      join(process.cwd(), "src", "components", "wizard", "PilotModePolicyPackToggle.tsx"),
      "utf8",
    );
    const actorEditor = readFileSync(
      join(process.cwd(), "src", "components", "draft-intake", "DraftIntakeActorEditor.tsx"),
      "utf8",
    );

    expect(pathSwitcher).toContain('className="space-y-4"');
    expect(pathSwitcher).not.toContain('TabsContent value="quick-review" className="mt-0 pt-0"');
    expect(wizardFieldHint).toContain("OPERATOR_FORM_FIELD_LABEL_CLASS");
    expect(wizardFieldHint).not.toContain("leading-none");
    expect(wizardFieldHint).not.toContain("mb-1");
    expect(pilotToggle).toContain("OPERATOR_FORM_FIELD_STACK_CLASS");
    expect(pilotToggle).toContain("OPERATOR_FORM_CONTROL_DESCRIPTION_GAP_CLASS");
    expect(actorEditor).toContain("OPERATOR_FORM_FIELD_STACK_CLASS");
  });

  it("applies TB-2000 stacks on guided intake step 0 field groups (TB-2001)", () => {
    const guidedIntake = readFileSync(
      join(process.cwd(), "src", "app", "(operator)", "architecture", "reviews", "new", "SocraticIntakeWizard.tsx"),
      "utf8",
    );

    expect(guidedIntake).toContain("OPERATOR_FORM_FIELD_STACK_CLASS");
    expect(guidedIntake).toContain("OPERATOR_FORM_FIELD_HELPER_CLASS");
    expect(guidedIntake).not.toMatch(/step === 0[\s\S]*space-y-2/);
  });
});
