import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  RUN_DETAIL_ACTIVITY_PRE_COMMIT_CLAIM_DISCIPLINE,
  RUN_DETAIL_ACTIVITY_PRE_COMMIT_SOURCES,
  RUN_DETAIL_ACTIVITY_PRE_COMMIT_SOURCES_INTRO,
} from "@/lib/runs/run-detail-activity-sources";
import { cn } from "@/lib/utils";

export function RunDetailActivitySourcesPanel(): React.JSX.Element {
  return (
    <section
      className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
      data-testid="run-detail-activity-sources"
    >
      <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Sources</h3>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {RUN_DETAIL_ACTIVITY_PRE_COMMIT_SOURCES_INTRO}
      </p>
      <ul className="m-0 mt-3 list-none space-y-2 p-0">
        {RUN_DETAIL_ACTIVITY_PRE_COMMIT_SOURCES.map((source) => (
          <li key={source.href}>
            <Link className={OPERATOR_LINK.nav} href={source.href}>
              {source.label}
            </Link>
          </li>
        ))}
      </ul>
      <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {RUN_DETAIL_ACTIVITY_PRE_COMMIT_CLAIM_DISCIPLINE}
      </p>
    </section>
  );
}
