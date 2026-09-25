import Link from "next/link";

import {
  HELP_HUB_CANONICAL_PATH,
  HELP_TOPIC_BREADCRUMB_HUB_LABEL,
} from "@/lib/help/help-hub-evidence-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type HelpTopicBreadcrumbProps = {
  readonly topicTitle: string;
};

/** Ancestor trail for in-app help topics: Help & Support → current topic. */
export function HelpTopicBreadcrumb(props: HelpTopicBreadcrumbProps): React.JSX.Element {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("mb-2", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="help-topic-breadcrumb"
    >
      <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        <li>
          <Link className={OPERATOR_LINK.inline} href={HELP_HUB_CANONICAL_PATH}>
            {HELP_TOPIC_BREADCRUMB_HUB_LABEL}
          </Link>
        </li>
        <li aria-hidden="true" className="text-al-text-secondary">/</li>
        <li aria-current="page" className="text-al-text-primary">
          {props.topicTitle}
        </li>
      </ol>
    </nav>
  );
}
