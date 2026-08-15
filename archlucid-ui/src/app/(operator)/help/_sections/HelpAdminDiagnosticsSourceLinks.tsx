"use client";

import Link from "next/link";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { StatusTag } from "@/components/ui/status-tag";
import {
  ADMIN_DIAGNOSTICS_HELP_LIVE_PANEL_INTRO,
  ADMIN_DIAGNOSTICS_HELP_LIVE_PANEL_TITLE,
  ADMIN_DIAGNOSTICS_HELP_LIVE_SURFACES,
  ADMIN_DIAGNOSTICS_HELP_RELATED_TOPICS_INTRO,
  ADMIN_DIAGNOSTICS_HELP_RELATED_TOPICS_TITLE,
  type AdminDiagnosticsHelpSourceLink,
} from "@/lib/admin-diagnostics-help-evidence-copy";
import { listAdminDiagnosticsHelpRelatedTopics } from "@/lib/admin-diagnostics-help-related-topics";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

function AdminDiagnosticsHelpSourceListItem(props: {
  readonly link: AdminDiagnosticsHelpSourceLink;
}): React.ReactElement {
  const { link } = props;

  return (
    <li className="flex flex-wrap items-center gap-2">
      <Link
        className={cn(OPERATOR_LINK.inline, "inline-flex min-h-6 items-center py-1 font-medium")}
        href={link.href}
      >
        {link.label}
      </Link>
      {link.adminOnly === true ? (
        <StatusTag kind="neutral" label="Admin" data-testid="help-admin-diagnostics-admin-tag" />
      ) : null}
    </li>
  );
}

function AdminDiagnosticsHelpSourceList(props: {
  readonly links: readonly AdminDiagnosticsHelpSourceLink[];
  readonly testId: string;
}): React.ReactElement {
  const { links, testId } = props;

  return (
    <ul className={cn("m-0 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.body)} data-testid={testId}>
      {links.map((link) => (
        <AdminDiagnosticsHelpSourceListItem key={`${link.href}-${link.label}`} link={link} />
      ))}
    </ul>
  );
}

/** Live surfaces and related Help topics for admin diagnostics (HAE). */
export function HelpAdminDiagnosticsSourceLinks(): React.ReactElement {
  const { callerAuthorityRank } = useOperatorNavAuthority();
  const isAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const relatedTopics = listAdminDiagnosticsHelpRelatedTopics(isAdmin);

  return (
    <div className="space-y-6" data-testid="help-admin-diagnostics-source-links">
      <section aria-labelledby="help-admin-diagnostics-live-surfaces-heading">
        <h3
          id="help-admin-diagnostics-live-surfaces-heading"
          className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          {ADMIN_DIAGNOSTICS_HELP_LIVE_PANEL_TITLE}
        </h3>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {ADMIN_DIAGNOSTICS_HELP_LIVE_PANEL_INTRO}
        </p>
        <div className="mt-2">
          <AdminDiagnosticsHelpSourceList
            links={ADMIN_DIAGNOSTICS_HELP_LIVE_SURFACES}
            testId="help-admin-diagnostics-live-surfaces"
          />
        </div>
      </section>

      <section aria-labelledby="help-admin-diagnostics-related-topics-heading">
        <h3
          id="help-admin-diagnostics-related-topics-heading"
          className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          {ADMIN_DIAGNOSTICS_HELP_RELATED_TOPICS_TITLE}
        </h3>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {ADMIN_DIAGNOSTICS_HELP_RELATED_TOPICS_INTRO}
        </p>
        <div className="mt-2">
          <AdminDiagnosticsHelpSourceList
            links={relatedTopics}
            testId="help-admin-diagnostics-related-topics"
          />
        </div>
      </section>
    </div>
  );
}
