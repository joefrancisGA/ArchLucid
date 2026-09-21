import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { OPERATOR_LAYOUT, OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  FIRST_LOGIN_WORKSPACE_HELP_CREATE_SECTION,
  FIRST_LOGIN_WORKSPACE_HELP_FIRST_CHOICE_SECTION,
  FIRST_LOGIN_WORKSPACE_HELP_INVITE_SECTION,
  FIRST_LOGIN_WORKSPACE_HELP_NOT_LIVE_SECTION,
  FIRST_LOGIN_WORKSPACE_HELP_OVERVIEW,
  FIRST_LOGIN_WORKSPACE_HELP_RECORD_VS_TRAINING_SECTION,
  FIRST_LOGIN_WORKSPACE_HELP_TITLE,
} from "@/lib/first-login-workspace-help-guide-content";
import { FIRST_LOGIN_WORKSPACE_HELP_PATH } from "@/lib/first-login-workspace-help-route";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { inAppHelpHref } from "@/lib/product-documentation-registry-helpers";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import Link from "next/link";

type HelpFirstLoginWorkspaceGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

/** LS-015 — first login, Training vs live workspace, Record vs Training. */
export function HelpFirstLoginWorkspaceGuideView(
  props: HelpFirstLoginWorkspaceGuideViewProps,
): React.ReactElement {
  const { entry } = props;
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-first-login-workspace-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={FIRST_LOGIN_WORKSPACE_HELP_TITLE}
        titleTestId="help-first-login-workspace-page-title"
        subtitle="Live tenant workspace, Training, and review type."
        navHref={FIRST_LOGIN_WORKSPACE_HELP_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
      />

      <p className={readingBodyClass} data-testid="help-first-login-workspace-overview">
        {FIRST_LOGIN_WORKSPACE_HELP_OVERVIEW}
      </p>

      <section className={OPERATOR_LAYOUT.sectionStack} aria-labelledby="help-first-login-invite-heading">
        <h2
          id="help-first-login-invite-heading"
          className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 scroll-mt-24")}
        >
          Invited users
        </h2>
        <p className={readingBodyClass} data-testid="help-first-login-workspace-invite">
          {FIRST_LOGIN_WORKSPACE_HELP_INVITE_SECTION}
        </p>
      </section>

      <section className={OPERATOR_LAYOUT.sectionStack} aria-labelledby="help-first-login-create-heading">
        <h2
          id="help-first-login-create-heading"
          className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 scroll-mt-24")}
        >
          Create or request access
        </h2>
        <p className={readingBodyClass} data-testid="help-first-login-workspace-create">
          {FIRST_LOGIN_WORKSPACE_HELP_CREATE_SECTION}
        </p>
      </section>

      <section className={OPERATOR_LAYOUT.sectionStack} aria-labelledby="help-first-login-choice-heading">
        <h2
          id="help-first-login-choice-heading"
          className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 scroll-mt-24")}
        >
          First-time Training question
        </h2>
        <p className={readingBodyClass} data-testid="help-first-login-workspace-first-choice">
          {FIRST_LOGIN_WORKSPACE_HELP_FIRST_CHOICE_SECTION}
        </p>
      </section>

      <section className={OPERATOR_LAYOUT.sectionStack} aria-labelledby="help-first-login-record-heading">
        <h2
          id="help-first-login-record-heading"
          className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 scroll-mt-24")}
        >
          Record, Practice, and Training
        </h2>
        <p className={readingBodyClass} data-testid="help-first-login-workspace-record-vs-training">
          {FIRST_LOGIN_WORKSPACE_HELP_RECORD_VS_TRAINING_SECTION}
        </p>
        <p className={cn(readingBodyClass, "text-al-text-secondary")}>
          Review-type detail lives in{" "}
          <Link href={inAppHelpHref("career-rehearsal-doors")} className="font-medium underline-offset-2 hover:underline">
            Record and Practice
          </Link>
          . Workspace labels live in{" "}
          <Link href="/help/scope" className="font-medium underline-offset-2 hover:underline">
            Workspace and scope
          </Link>
          .
        </p>
      </section>

      <section className={OPERATOR_LAYOUT.sectionStack} aria-labelledby="help-first-login-not-live-heading">
        <h2
          id="help-first-login-not-live-heading"
          className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 scroll-mt-24")}
        >
          NOT LIVE DATA unexpected
        </h2>
        <p className={readingBodyClass} data-testid="help-first-login-workspace-not-live">
          {FIRST_LOGIN_WORKSPACE_HELP_NOT_LIVE_SECTION}
        </p>
      </section>
    </article>
  );
}
