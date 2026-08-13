import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpUsersAndRolesManageAction } from "@/app/(operator)/help/_sections/HelpUsersAndRolesManageAction";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { UsersAndRolesHelpEvidenceOrientationStrip } from "@/components/help/UsersAndRolesHelpEvidenceOrientationStrip";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LAYOUT, OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { inAppHelpHref, type ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  USERS_AND_ROLES_CAPABILITY_MATRIX_CAPTION,
  USERS_AND_ROLES_CAPABILITY_MATRIX_HEADING,
  USERS_AND_ROLES_FAQ_HEADING,
  USERS_AND_ROLES_HOW_ACCESS_WORKS_BODY,
  USERS_AND_ROLES_HOW_ACCESS_WORKS_HEADING,
  USERS_AND_ROLES_MANAGING_ACCESS_HEADING,
  USERS_AND_ROLES_PAGE_INTRO,
  USERS_AND_ROLES_PAGE_TITLE,
  USERS_AND_ROLES_REVIEW_PARTICIPATION_BODY,
  USERS_AND_ROLES_REVIEW_PARTICIPATION_HEADING,
  USERS_AND_ROLES_ROLE_OVERVIEW_HEADING,
  USERS_AND_ROLES_SCOPE_GUIDE_LINK_LABEL,
  USERS_AND_ROLES_SECURITY_GUIDANCE_HEADING,
  USERS_AND_ROLES_SECURITY_GUIDANCE_ITEMS,
  USERS_AND_ROLES_SECURITY_TRUST_LINK_LABEL,
  USERS_AND_ROLES_WORKSPACE_ACCESS_BODY,
  USERS_AND_ROLES_WORKSPACE_ACCESS_HEADING,
} from "@/lib/users-and-roles-help-copy";
import {
  USERS_AND_ROLES_CAPABILITY_ROWS,
  USERS_AND_ROLES_FAQ,
  USERS_AND_ROLES_GUIDE_HEADINGS,
  USERS_AND_ROLES_MANAGING_ACCESS_STEPS,
  USERS_AND_ROLES_ROLE_OVERVIEW,
  USERS_AND_ROLES_SCOPE_GUIDE_HREF,
  USERS_AND_ROLES_SECURITY_TRUST_HREF,
} from "@/lib/users-and-roles-help-manifest";
import { cn } from "@/lib/utils";

type HelpUsersAndRolesGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

function HelpSectionHeading(props: { readonly id: string; readonly children: string }): React.ReactElement {
  return (
    <h2
      id={props.id}
      className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 mt-10 first:mt-0 scroll-mt-24")}
    >
      {props.children}
    </h2>
  );
}

function RoleOverviewTable(): React.ReactElement {
  return (
    <div className={HELP_PAGE_LAYOUT.tableWrap} data-testid="users-and-roles-role-overview-table">
      <table className={HELP_PAGE_LAYOUT.table}>
        <caption className="sr-only">Built-in workspace roles</caption>
        <thead>
          <tr>
            <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
              Role
            </th>
            <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
              Intended for
            </th>
            <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
              Principal capabilities
            </th>
            <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
              Major restrictions
            </th>
          </tr>
        </thead>
        <tbody>
          {USERS_AND_ROLES_ROLE_OVERVIEW.map((role) => (
            <tr key={role.id}>
              <th scope="row" className={HELP_PAGE_LAYOUT.tableHeadCell}>
                {role.label}
              </th>
              <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{role.intendedUser}</td>
              <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{role.summary}</td>
              <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{role.restrictions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CapabilityMatrixTable(): React.ReactElement {
  return (
    <div className={HELP_PAGE_LAYOUT.tableWrap} data-testid="users-and-roles-capability-matrix">
      <table className={HELP_PAGE_LAYOUT.table}>
        <caption className="sr-only">{USERS_AND_ROLES_CAPABILITY_MATRIX_CAPTION}</caption>
        <thead>
          <tr>
            <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
              Capability
            </th>
            {USERS_AND_ROLES_ROLE_OVERVIEW.map((role) => (
              <th key={role.id} scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
                {role.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {USERS_AND_ROLES_CAPABILITY_ROWS.map((row) => (
            <tr key={row.id}>
              <th scope="row" className={HELP_PAGE_LAYOUT.tableHeadCell}>
                {row.label}
              </th>
              {USERS_AND_ROLES_ROLE_OVERVIEW.map((role) => (
                <td key={role.id} className={HELP_PAGE_LAYOUT.tableBodyCell}>
                  <span
                    className="inline-flex min-w-[2rem] justify-center font-semibold"
                    aria-label={`${row.label} for ${role.label}: ${row.roles[role.id] ? "Allowed" : "Not allowed"}`}
                  >
                    <span aria-hidden="true">{row.roles[role.id] ? "Yes" : "—"}</span>
                    <span className="sr-only">{row.roles[role.id] ? "Allowed" : "Not allowed"}</span>
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Customer-facing users and roles guide for `/help/users-and-roles`. */
export function HelpUsersAndRolesGuideView(props: HelpUsersAndRolesGuideViewProps): React.ReactElement {
  const { entry } = props;

  return (
    <article className={OPERATOR_LAYOUT.majorSectionGap} data-testid="help-users-and-roles-page">
      <HelpTopicHashScroll />
      <OperatorPageHeader
        title={USERS_AND_ROLES_PAGE_TITLE}
        titleTestId="help-users-and-roles-page-title"
        subtitle={USERS_AND_ROLES_PAGE_INTRO}
        navHref={inAppHelpHref(entry.slug)}
        headingLevel="h1"
        actions={<HelpUsersAndRolesManageAction />}
      />

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")}>
          <section className="space-y-3" aria-labelledby="users-and-roles-how-access-works-heading">
            <HelpSectionHeading id="how-access-works">{USERS_AND_ROLES_HOW_ACCESS_WORKS_HEADING}</HelpSectionHeading>
            <p
              id="users-and-roles-how-access-works-heading"
              className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            >
              {USERS_AND_ROLES_HOW_ACCESS_WORKS_BODY}
            </p>
          </section>

          <section className="space-y-3" aria-labelledby="users-and-roles-role-overview-heading">
            <HelpSectionHeading id="role-overview">{USERS_AND_ROLES_ROLE_OVERVIEW_HEADING}</HelpSectionHeading>
            <RoleOverviewTable />
          </section>

          <section className="space-y-3" aria-labelledby="users-and-roles-capability-matrix-heading">
            <HelpSectionHeading id="capability-matrix">{USERS_AND_ROLES_CAPABILITY_MATRIX_HEADING}</HelpSectionHeading>
            <UsersAndRolesHelpEvidenceOrientationStrip />
            <p
              id="users-and-roles-capability-matrix-heading"
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            >
              {USERS_AND_ROLES_CAPABILITY_MATRIX_CAPTION}
            </p>
            <CapabilityMatrixTable />
          </section>

          <section className="space-y-3" aria-labelledby="users-and-roles-workspace-access-heading">
            <HelpSectionHeading id="workspace-access">{USERS_AND_ROLES_WORKSPACE_ACCESS_HEADING}</HelpSectionHeading>
            <p
              id="users-and-roles-workspace-access-heading"
              className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            >
              {USERS_AND_ROLES_WORKSPACE_ACCESS_BODY}{" "}
              <Link href={USERS_AND_ROLES_SCOPE_GUIDE_HREF} className="text-teal-700 underline dark:text-teal-400">
                {USERS_AND_ROLES_SCOPE_GUIDE_LINK_LABEL}
              </Link>
              .
            </p>
          </section>

          <section className="space-y-3" aria-labelledby="users-and-roles-review-participation-heading">
            <HelpSectionHeading id="review-participation">{USERS_AND_ROLES_REVIEW_PARTICIPATION_HEADING}</HelpSectionHeading>
            <p
              id="users-and-roles-review-participation-heading"
              className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            >
              {USERS_AND_ROLES_REVIEW_PARTICIPATION_BODY}
            </p>
          </section>

          <section className="space-y-3" aria-labelledby="users-and-roles-managing-access-heading">
            <HelpSectionHeading id="managing-access">{USERS_AND_ROLES_MANAGING_ACCESS_HEADING}</HelpSectionHeading>
            <ol
              id="users-and-roles-managing-access-heading"
              className={cn("m-0 max-w-prose list-decimal space-y-2 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            >
              {USERS_AND_ROLES_MANAGING_ACCESS_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section className="space-y-3" aria-labelledby="users-and-roles-security-guidance-heading">
            <HelpSectionHeading id="security-guidance">{USERS_AND_ROLES_SECURITY_GUIDANCE_HEADING}</HelpSectionHeading>
            <ul
              id="users-and-roles-security-guidance-heading"
              className={cn("m-0 max-w-prose list-disc space-y-2 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            >
              {USERS_AND_ROLES_SECURITY_GUIDANCE_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              <Link href={USERS_AND_ROLES_SECURITY_TRUST_HREF} className="text-teal-700 underline dark:text-teal-400">
                {USERS_AND_ROLES_SECURITY_TRUST_LINK_LABEL}
              </Link>
            </p>
          </section>

          <section className="space-y-4" aria-labelledby="users-and-roles-faq-heading">
            <HelpSectionHeading id="common-questions">{USERS_AND_ROLES_FAQ_HEADING}</HelpSectionHeading>
            <div className="space-y-4">
              {USERS_AND_ROLES_FAQ.map((item) => (
                <div key={item.id} data-testid={`users-and-roles-faq-${item.id}`}>
                  <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{item.question}</h3>
                  <p className={cn("m-0 mt-2 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <HelpTopicTableOfContents headings={USERS_AND_ROLES_GUIDE_HEADINGS} enableScrollSpy />
      </div>
    </article>
  );
}
