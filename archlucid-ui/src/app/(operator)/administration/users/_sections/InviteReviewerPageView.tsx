"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  INVITE_REVIEWER_REVIEW_ID_QUERY_PARAM,
  buildInviteReviewerPrefillMessage,
} from "@/lib/invite-reviewer-flow";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  INVITE_REVIEWER_BACK_LABEL,
  INVITE_REVIEWER_BACK_TO_REVIEW_HREF,
  INVITE_REVIEWER_FOOTER_LEAD,
  INVITE_REVIEWER_FORBIDDEN_DESCRIPTION,
  INVITE_REVIEWER_PAGE_TITLE,
  SETTINGS_ROLES_USERS_TAB_PATH,
} from "@/lib/invite-reviewer-flow";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { InviteReviewerBuyerChrome } from "./InviteReviewerBuyerChrome";
import { InviteReviewerBreadcrumb } from "./InviteReviewerBreadcrumb";
import { inviteReviewerPageSubtitle } from "./invite-reviewer-page-copy";
import { INVITE_REVIEWER_CLAIM_DISCIPLINE } from "@/lib/invite-reviewer-evidence-copy";

import { SettingsRolesInvitePanel } from "./SettingsRolesInvitePanel";
import { InviteReviewerReaderCapabilitiesSummary } from "./InviteReviewerReaderCapabilitiesSummary";
import type { SettingsRolesPageViewModel } from "./settings-roles-page-view-model";

type Props = {
  readonly model: SettingsRolesPageViewModel;
};

export function InviteReviewerPageView(props: Props) {
  const m = props.model;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const searchParams = useSearchParams();
  const reviewIdFromQuery = searchParams.get(INVITE_REVIEWER_REVIEW_ID_QUERY_PARAM)?.trim() ?? "";
  const invitePrefillMessage =
    reviewIdFromQuery.length > 0 ? buildInviteReviewerPrefillMessage(reviewIdFromQuery) : undefined;

  if (m.surface === "demo") {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability="Invite reviewer"
        description="In a connected workspace, workspace administrators can invite reviewers with Reader or Auditor access for architecture review sign-off."
      />
    );
  }

  if (m.surface === "authority_loading") {
    return (
      <OperatorPageContainer variant="reading" className={OPERATOR_LAYOUT.sectionStack} data-testid="invite-reviewer-page">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p>
      </OperatorPageContainer>
    );
  }

  if (m.surface === "forbidden") {
    return (
      <OperatorPageContainer variant="reading" className={OPERATOR_LAYOUT.sectionStack} data-testid="invite-reviewer-page">
        <InviteReviewerPageHeader buyerPolishedShell={buyerPolishedShell} />
        <Card>
          <CardContent className="pt-6">
            <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert" data-testid="invite-reviewer-forbidden">
              {INVITE_REVIEWER_FORBIDDEN_DESCRIPTION}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" asChild>
                <Link href={INVITE_REVIEWER_BACK_TO_REVIEW_HREF}>{INVITE_REVIEWER_BACK_LABEL}</Link>
              </Button>
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href={SETTINGS_ROLES_USERS_TAB_PATH}>Open Users and roles</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </OperatorPageContainer>
    );
  }

  return (
    <OperatorPageContainer variant="reading" className={OPERATOR_LAYOUT.sectionStack} data-testid="invite-reviewer-page">
      <InviteReviewerPageHeader buyerPolishedShell={buyerPolishedShell} />
      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Reviewer invitation</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsRolesInvitePanel initialMessage={invitePrefillMessage} reviewId={reviewIdFromQuery} />
        </CardContent>
      </Card>

      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="invite-reviewer-footer">
        {INVITE_REVIEWER_FOOTER_LEAD}{" "}
        <Link href={SETTINGS_ROLES_USERS_TAB_PATH} className={OPERATOR_LINK.nav}>
          Open Users and roles
        </Link>
        .
      </p>
    </OperatorPageContainer>
  );
}

function InviteReviewerPageHeader(props: { readonly buyerPolishedShell: boolean }): React.JSX.Element {
  return (
    <>
      <OperatorPageHeader
        title={INVITE_REVIEWER_PAGE_TITLE}
        headingLevel="h1"
        subtitle={inviteReviewerPageSubtitle(props.buyerPolishedShell)}
        claimDiscipline={INVITE_REVIEWER_CLAIM_DISCIPLINE}
        claimDisciplineTestId="invite-reviewer-claim-discipline"
        breadcrumb={props.buyerPolishedShell ? <InviteReviewerBreadcrumb /> : undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="h-8 px-2" asChild>
              <Link href={INVITE_REVIEWER_BACK_TO_REVIEW_HREF}>{INVITE_REVIEWER_BACK_LABEL}</Link>
            </Button>
            {props.buyerPolishedShell ? null : <PageContextualHelpButton />}
          </div>
        }
      >
        <InviteReviewerReaderCapabilitiesSummary />
      </OperatorPageHeader>
      <InviteReviewerBuyerChrome />
    </>
  );
}
