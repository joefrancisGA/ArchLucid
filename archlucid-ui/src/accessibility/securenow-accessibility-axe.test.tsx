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
import { SecureNowSkuCardView } from "@/app/(marketing)/securenow-sku/SecureNowSkuCardView";
import { SecureNowSampleView } from "@/app/(marketing)/securenow-sample/SecureNowSampleView";
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
    ["first hour", <SecureNowFirstHourPageView key="first-hour" />],
    ["compliance notes", <SecureNowComplianceNotesPageView key="compliance-notes" />],
    ["self-service", <SecureNowSelfServicePageView key="self-service" />],
    ["return reasons", <SecureNowReturnReasonsPageView key="return-reasons" />],
    ["pilot decision", <SecureNowPilotDecisionPageView key="pilot-decision" />],
    ["investigation effort", <SecureNowInvestigationEffortPageView key="investigation-effort" />],
    ["public synthetic sample", <SecureNowSampleView key="public-synthetic-sample" />],
    ["public SKU card", <SecureNowSkuCardView key="public-sku-card" />],
  ])("has no serious axe violations on the SecureNow %s page", async (_label, view) => {
    const { container } = render(view);

    expect(await axe(container)).toHaveNoViolations();
  });
});
