import { describe, expect, it } from "vitest";

import {
  AUTHENTICATION_SIGN_IN_HELP_SECONDARY_ACTIONS,
  splitAuthenticationSignInHelpMarkdown,
} from "@/lib/authentication-sign-in-help-guide-content";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";

describe("splitAuthenticationSignInHelpMarkdown", () => {
  const loaded = tryLoadProductDocumentation("authentication-sign-in");

  it("splits authentication help markdown into specialty sections", () => {
    if (loaded === null) {
      throw new Error("Expected authentication documentation to load.");
    }

    const sourceDocPath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourceDocPath, {
      helpTopicSlug: loaded.entry.slug,
    });
    const sections = splitAuthenticationSignInHelpMarkdown(preparedMarkdown);

    expect(sections.introMarkdown).toMatch(/passwordless sign-in/i);
    expect(sections.howSignInWorksMarkdown).toMatch(/## How sign-in works/);
    expect(sections.commonIssuesMarkdown).toMatch(/Organization sign-in required/);
    expect(sections.accountRecoveryMarkdown).toMatch(/Email-code users/);
    expect(sections.startingEvaluationMarkdown).toMatch(/Start your evaluation/);
    expect(sections.acceptingInvitationMarkdown).toMatch(/invitation link/i);
    expect(sections.enterpriseSsoMarkdown).toMatch(/Optional SSO/);
    expect(sections.securityPrivacyMarkdown).toMatch(/audit trail/);
    expect(sections.relatedMarkdown).toMatch(/Users and roles/);
  });

  it("keeps evaluation and invite CTAs on dedicated secondary actions", () => {
    expect(AUTHENTICATION_SIGN_IN_HELP_SECONDARY_ACTIONS.startEvaluation.href).toBe("/signup");
    expect(AUTHENTICATION_SIGN_IN_HELP_SECONDARY_ACTIONS.acceptInvitation.href).toBe(
      "#accepting-an-invitation",
    );
  });
});
