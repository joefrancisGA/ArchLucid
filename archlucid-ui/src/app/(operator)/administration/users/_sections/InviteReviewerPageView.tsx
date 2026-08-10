"use client";

import Link from "next/link";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  INVITE_REVIEWER_BACK_LABEL,
  INVITE_REVIEWER_BACK_TO_REVIEW_HREF,
  INVITE_REVIEWER_FOOTER_LEAD,
  INVITE_REVIEWER_FORBIDDEN_DESCRIPTION,
  INVITE_REVIEWER_PAGE_LEAD,
  INVITE_REVIEWER_PAGE_TITLE,
  SETTINGS_ROLES_USERS_TAB_PATH,
} from "@/lib/invite-reviewer-flow";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { SettingsRolesInvitePanel } from "./SettingsRolesInvitePanel";
import { InviteReviewerReaderCapabilitiesSummary } from "./InviteReviewerReaderCapabilitiesSummary";
import type { SettingsRolesPageViewModel } from "./settings-roles-page-view-model";

type Props = {
  readonly model: SettingsRolesPageViewModel;
};

export function InviteReviewerPageView(props: Props) {
  const m = props.model;

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
      <div className="w-full max-w-[720px] space-y-6" data-testid="invite-reviewer-page">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p>
      </div>
    );
  }

  if (m.surface === "forbidden") {
    return (
      <div className="w-full max-w-[720px] space-y-6" data-testid="invite-reviewer-page">
        <InviteReviewerPageHeader />
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
      </div>
    );
  }

  return (
    <div className="w-full max-w-[720px] space-y-6" data-testid="invite-reviewer-page">
      <InviteReviewerPageHeader />
      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Reviewer invitation</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsRolesInvitePanel />
        </CardContent>
      </Card>

      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="invite-reviewer-footer">
        {INVITE_REVIEWER_FOOTER_LEAD}{" "}
        <Link href={SETTINGS_ROLES_USERS_TAB_PATH} className={OPERATOR_LINK.nav}>
          Open Users and roles
        </Link>
        .
      </p>
    </div>
  );
}

function InviteReviewerPageHeader(): React.JSX.Element {
  return (
    <header className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Button type="button" variant="outline" size="sm" className="-ml-2 h-8 px-2" asChild>
          <Link href={INVITE_REVIEWER_BACK_TO_REVIEW_HREF}>{INVITE_REVIEWER_BACK_LABEL}</Link>
        </Button>
        <PageContextualHelpButton />
      </div>
      <div>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>{INVITE_REVIEWER_PAGE_TITLE}</h1>
        <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{INVITE_REVIEWER_PAGE_LEAD}</p>
        <InviteReviewerReaderCapabilitiesSummary />
      </div>
    </header>
  );
}
