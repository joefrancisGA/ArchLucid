import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it } from "vitest";

import { SecureNowAccessibilityPageView } from "@/app/(operator)/administration/securenow-accessibility/SecureNowAccessibilityPageView";
import { SecureNowComplianceNotesPageView } from "@/app/(operator)/administration/securenow-compliance-notes/SecureNowComplianceNotesPageView";
import { SecureNowFirstHourPageView } from "@/app/(operator)/administration/securenow-first-hour/SecureNowFirstHourPageView";
import { SecureNowInvestigationEffortPageView } from "@/app/(operator)/administration/securenow-investigation-effort/SecureNowInvestigationEffortPageView";
import { SecureNowPilotDecisionPageView } from "@/app/(operator)/administration/securenow-pilot-decision/SecureNowPilotDecisionPageView";
import { SecureNowReturnReasonsPageView } from "@/app/(operator)/administration/securenow-return-reasons/SecureNowReturnReasonsPageView";
import { SecureNowSelfServicePageView } from "@/app/(operator)/administration/securenow-self-service/SecureNowSelfServicePageView";
import { WhySecureNowDraftView } from "@/app/(marketing)/why-securenow/WhySecureNowDraftView";

expect.extend(toHaveNoViolations);

describe("SecureNow accessibility surfaces — axe", () => {
  it("has no serious axe violations on the operator accessibility page", async () => {
    const { container } = render(<SecureNowAccessibilityPageView />);

    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no serious axe violations on the Why SecureNow draft", async () => {
    const { container } = render(<WhySecureNowDraftView />);

    expect(await axe(container)).toHaveNoViolations();
  });

  it.each([
    ["first hour", <SecureNowFirstHourPageView />],
    ["compliance notes", <SecureNowComplianceNotesPageView />],
    ["self-service", <SecureNowSelfServicePageView />],
    ["return reasons", <SecureNowReturnReasonsPageView />],
    ["pilot decision", <SecureNowPilotDecisionPageView />],
    ["investigation effort", <SecureNowInvestigationEffortPageView />],
  ])("has no serious axe violations on the SecureNow %s page", async (_label, view) => {
    const { container } = render(view);

    expect(await axe(container)).toHaveNoViolations();
  });
});
