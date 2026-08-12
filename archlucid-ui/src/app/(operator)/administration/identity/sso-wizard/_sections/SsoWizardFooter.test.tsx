import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SsoWizardFooter } from "@/app/(operator)/administration/identity/sso-wizard/_sections/SsoWizardFooter";
import { whyDisabledNeedsPrerequisite } from "@/lib/why-disabled-cta";

describe("SsoWizardFooter", () => {
  it("shows why-disabled helper copy when continue is blocked", () => {
    render(
      <SsoWizardFooter
        isFirstStep
        isLastStep={false}
        canContinue={false}
        canActivate={false}
        busy={false}
        primaryDisabledReason={whyDisabledNeedsPrerequisite("an identity provider")}
        onCancel={() => undefined}
      />,
    );

    expect(screen.getByTestId("sso-wizard-continue")).toBeDisabled();
    expect(screen.getByTestId("sso-wizard-primary-disabled-hint")).toHaveTextContent(/identity provider/i);
    expect(screen.getByTestId("sso-wizard-primary-disabled-hint").textContent).not.toMatch(/preset/i);
  });
});
