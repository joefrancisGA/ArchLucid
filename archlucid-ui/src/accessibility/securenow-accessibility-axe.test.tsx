import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it } from "vitest";

import { SecureNowAccessibilityPageView } from "@/app/(operator)/administration/securenow-accessibility/SecureNowAccessibilityPageView";
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
});
