"use client";

import Link from "next/link";

import {
  HELP_TOPIC_CATCHALL_CLAIM_DISCIPLINE,
  HELP_TOPIC_CATCHALL_SOURCES,
  HELP_TOPIC_CATCHALL_SOURCES_INTRO,
} from "@/lib/help-topic-catchall-evidence-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Workspace Sources + claim discipline for HE. residual markdown help topics. */
export function HelpTopicCatchAllEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <div className="mb-4 space-y-3" data-testid="help-topic-catchall-orientation">
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="help-topic-catchall-sources-heading"
        data-testid="help-topic-catchall-sources"
      >
        <h2
          id="help-topic-catchall-sources-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          Sources for follow-up
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {HELP_TOPIC_CATCHALL_SOURCES_INTRO}
        </p>
        <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
          {HELP_TOPIC_CATCHALL_SOURCES.map((link) => (
            <li key={`${link.href}-${link.label}`}>
              <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={link.href}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <aside
        className="rounded-md border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20"
        data-testid="help-topic-catchall-claim-discipline"
      >
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Markdown orientation only
        </h2>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{HELP_TOPIC_CATCHALL_CLAIM_DISCIPLINE}</p>
      </aside>
    </div>
  );
}
