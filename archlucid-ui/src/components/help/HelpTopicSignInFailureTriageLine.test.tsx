import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpTopicSignInFailureTriageLine } from "@/components/help/HelpTopicSignInFailureTriageLine";
import { AUTHENTICATION_SIGN_IN_FAILURE_TRIAGE_LINKS } from "@/lib/authentication-sign-in-help-triage";

describe("HelpTopicSignInFailureTriageLine", () => {
  it("renders triage links with keyboard-sized targets and hides decorative separators", () => {
    render(<HelpTopicSignInFailureTriageLine />);

    const triage = screen.getByTestId("help-topic-sign-in-failure-triage");

    expect(triage.querySelectorAll('[aria-hidden="true"]')).toHaveLength(
      AUTHENTICATION_SIGN_IN_FAILURE_TRIAGE_LINKS.length,
    );

    for (const link of AUTHENTICATION_SIGN_IN_FAILURE_TRIAGE_LINKS) {
      const anchor = screen.getByRole("link", { name: link.label });
      expect(anchor).toHaveAttribute("href", link.href);
      expect(anchor.className).toMatch(/min-h-6/);
    }
  });
});
