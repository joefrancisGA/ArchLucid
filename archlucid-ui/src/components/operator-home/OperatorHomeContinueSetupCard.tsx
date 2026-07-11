import Link from "next/link";

import { OperatorHomeCardSectionTitle } from "@/components/operator-home/OperatorHomeCardSectionTitle";
import {
  OPERATOR_HOME_CONNECT_CLOUD_BODY,
  OPERATOR_HOME_CONNECT_CLOUD_TITLE,
  OPERATOR_HOME_CONTINUE_SETUP_BODY,
  OPERATOR_HOME_INVITE_COLLABORATORS_BODY,
  OPERATOR_HOME_ONE_REQUIRED_ITEM_TITLE,
  OPERATOR_HOME_READY_TO_BEGIN_TITLE,
  OPERATOR_HOME_SETUP_CLOUD_CONNECTION_LABEL,
  OPERATOR_HOME_SETUP_REVIEWER_INVITATION_LABEL,
  OPERATOR_HOME_SETUP_STATUS_OPTIONAL,
  OPERATOR_HOME_SETUP_STATUS_READY,
  OPERATOR_HOME_SETUP_WORKSPACE_ACCESS_LABEL,
  PILOT_COMMAND_CENTER_CONNECT_AZURE,
  PILOT_COMMAND_CENTER_INVITE_REVIEWER,
  PILOT_COMMAND_CENTER_OPTIONAL_SETUP_LABEL,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_LAYOUT, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_CARD, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { INVITE_REVIEWER_PATH } from "@/lib/invite-reviewer-flow";
import { cn } from "@/lib/utils";

export type OperatorHomeContinueSetupCardProps = {
  readonly loading?: boolean;
  readonly canBegin?: boolean;
  readonly blockerMessage?: string | null;
};

const setupActionLinkClass = cn(
  "inline-flex shrink-0 items-center rounded-md border border-neutral-300 px-3 py-1.5",
  OPERATOR_TYPE_SCALE.button,
  "font-medium text-al-text-primary hover:border-neutral-400 hover:bg-[var(--al-layer-hover)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)]",
  "dark:border-neutral-700 dark:hover:border-neutral-600",
);

function SetupChecklistItem(props: {
  readonly label: string;
  readonly status: string;
  readonly statusTestId: string;
}): React.JSX.Element {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className={cn(OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>{props.label}</span>
      <span
        className={cn(OPERATOR_TYPE_SCALE.micro, "text-al-text-secondary")}
        data-testid={props.statusTestId}
      >
        {props.status}
      </span>
    </li>
  );
}

/** Home readiness panel — explicit optional setup, no unexplained fractional counts. */
export function OperatorHomeContinueSetupCard(props: OperatorHomeContinueSetupCardProps = {}) {
  const canBegin = props.canBegin !== false && props.blockerMessage == null;
  const heading = canBegin ? OPERATOR_HOME_READY_TO_BEGIN_TITLE : OPERATOR_HOME_ONE_REQUIRED_ITEM_TITLE;

  return (
    <section
      aria-labelledby="continue-setup-heading"
      className={cn(OPERATOR_SURFACE_CARD_CLASS, OPERATOR_CARD.body, "space-y-4")}
      data-testid="home-block-continue-setup"
    >
      <div className={cn("min-w-0", OPERATOR_LAYOUT.sectionHeadingStack)}>
        <OperatorHomeCardSectionTitle id="continue-setup-heading">
          {heading}
        </OperatorHomeCardSectionTitle>

        {canBegin ? (
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
            {OPERATOR_HOME_CONTINUE_SETUP_BODY}
          </p>
        ) : (
          <p
            className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}
            data-testid="operator-home-readiness-blocker"
          >
            {props.blockerMessage}
          </p>
        )}

        <ul
          className={cn("m-0 list-none space-y-1 p-0", OPERATOR_TYPE_SCALE.helper)}
          data-testid="operator-home-setup-checklist"
        >
          <SetupChecklistItem
            label={OPERATOR_HOME_SETUP_WORKSPACE_ACCESS_LABEL}
            status={OPERATOR_HOME_SETUP_STATUS_READY}
            statusTestId="operator-home-setup-workspace-access-status"
          />
          <SetupChecklistItem
            label={OPERATOR_HOME_SETUP_CLOUD_CONNECTION_LABEL}
            status={OPERATOR_HOME_SETUP_STATUS_OPTIONAL}
            statusTestId="operator-home-setup-cloud-status"
          />
          <SetupChecklistItem
            label={OPERATOR_HOME_SETUP_REVIEWER_INVITATION_LABEL}
            status={OPERATOR_HOME_SETUP_STATUS_OPTIONAL}
            statusTestId="operator-home-setup-reviewer-status"
          />
        </ul>
      </div>

      <div className={cn("space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800", OPERATOR_LAYOUT.sectionHeadingStack)}>
        <h3 className={cn("m-0", OPERATOR_TYPE_SCALE.sectionTitle)}>{PILOT_COMMAND_CENTER_OPTIONAL_SETUP_LABEL}</h3>

        <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", OPERATOR_LAYOUT.inlineGap)}>
          <div className="min-w-0 space-y-1">
            <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "font-medium text-al-text-primary")}>
              {OPERATOR_HOME_CONNECT_CLOUD_TITLE}
            </p>
            <p className={cn("m-0", OPERATOR_TYPE_SCALE.micro, "text-al-text-secondary")}>
              {OPERATOR_HOME_CONNECT_CLOUD_BODY}
            </p>
          </div>
          <Link
            href={CLOUD_CONNECTIONS_PATH}
            className={setupActionLinkClass}
            data-testid="continue-setup-connect-cloud"
          >
            {PILOT_COMMAND_CENTER_CONNECT_AZURE}
          </Link>
        </div>

        <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", OPERATOR_LAYOUT.inlineGap)}>
          <div className="min-w-0 space-y-1">
            <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
              {OPERATOR_HOME_INVITE_COLLABORATORS_BODY}
            </p>
          </div>
          <Link
            href={INVITE_REVIEWER_PATH}
            className={setupActionLinkClass}
            data-testid="continue-setup-invite-reviewer"
          >
            {PILOT_COMMAND_CENTER_INVITE_REVIEWER}
          </Link>
        </div>
      </div>
    </section>
  );
}
