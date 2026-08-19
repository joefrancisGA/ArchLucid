import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  HELP_TOPIC_PAGE_ICON,
  HELP_TOPIC_PAGE_ICON_CLASS,
} from "@/lib/help/help-topic-page-icon";

export type HelpTopicTitleRowProps = {
  title: string;
  titleTestId?: string;
  actions?: ReactNode;
  headingLevel?: "h1" | "h2";
  className?: string;
};

/** Book icon + page title row shared across `/help/*` topic headers. */
export function HelpTopicTitleRow(props: HelpTopicTitleRowProps): React.JSX.Element {
  const HeadingTag = props.headingLevel ?? "h1";
  const Icon = HELP_TOPIC_PAGE_ICON;

  return (
    <div className={cn("flex flex-wrap items-start gap-3", props.className)}>
      <Icon className={HELP_TOPIC_PAGE_ICON_CLASS} data-testid="help-topic-page-icon" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <HeadingTag
            className={cn("m-0 text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.pageTitle)}
            {...(props.titleTestId !== undefined ? { "data-testid": props.titleTestId } : {})}
          >
            {props.title}
          </HeadingTag>
          {props.actions !== undefined && props.actions !== null ? (
            <div className="ml-auto flex flex-wrap items-center gap-2">{props.actions}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
