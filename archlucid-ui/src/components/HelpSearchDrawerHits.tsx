import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

import {
  HELP_DRAWER_CHEVRON_CLASS,
  helpDrawerRowButtonClass,
} from "@/components/help/help-drawer-row-class";
import type { HelpDocSearchRecord } from "@/lib/help/help-index";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { stripMdLinks } from "./help-search-panel-hrefs";

export type HelpDrawerDocHitRowProps = {
  readonly hit: HelpDocSearchRecord;
  readonly isHighlighted: boolean;
  readonly onActivate: (record: HelpDocSearchRecord) => void;
  readonly onHighlight: () => void;
};

export function HelpDrawerDocHitRow({
  hit,
  isHighlighted,
  onActivate,
  onHighlight,
}: HelpDrawerDocHitRowProps): React.JSX.Element {
  const excerpt = stripMdLinks(hit.excerpt);
  const accessibleLabel = `${hit.sectionHeading}. ${excerpt}`;

  return (
    <li className="list-none">
      <button
        type="button"
        data-help-drawer-row=""
        aria-label={accessibleLabel}
        className={cn("group", helpDrawerRowButtonClass(isHighlighted))}
        onClick={() => {
          onActivate(hit);
        }}
        onFocus={onHighlight}
        onMouseEnter={onHighlight}
      >
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block font-semibold text-neutral-900 dark:text-neutral-100",
              OPERATOR_TYPOGRAPHY.body,
            )}
          >
            {hit.sectionHeading}
          </span>
          <span
            className={cn(
              "mt-1 block line-clamp-2 leading-snug text-neutral-600 dark:text-neutral-400",
              OPERATOR_TYPOGRAPHY.helper,
            )}
          >
            {excerpt}
          </span>
        </span>
        <ChevronRight className={HELP_DRAWER_CHEVRON_CLASS} aria-hidden />
      </button>
    </li>
  );
}

export function HelpDrawerGroupHeading({
  children,
  id,
}: {
  readonly children: string;
  readonly id?: string;
}): React.JSX.Element {
  return (
    <h3
      id={id}
      className={cn(
        "m-0 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400",
      )}
    >
      {children}
    </h3>
  );
}
