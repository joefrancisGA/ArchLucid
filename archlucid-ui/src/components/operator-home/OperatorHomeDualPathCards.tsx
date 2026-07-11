import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import {
  OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_BODY,
  OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_TITLE,
  OPERATOR_HOME_DUAL_PATH_CHOOSER_GUIDANCE,
  OPERATOR_HOME_RECOMMENDED_FIRST_BADGE,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_TITLE,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_LAYOUT, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Side-by-side create vs review entry points on Overview. */
export function OperatorHomeDualPathCards(): React.JSX.Element {
  return (
    <div className={cn("space-y-3", OPERATOR_LAYOUT.inlineGap)} data-testid="operator-home-dual-path-cards">
      <p
        className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}
        data-testid="operator-home-dual-path-chooser-guidance"
      >
        {OPERATOR_HOME_DUAL_PATH_CHOOSER_GUIDANCE}
      </p>
      <div className={cn("grid gap-3 sm:grid-cols-2", OPERATOR_LAYOUT.inlineGap)}>
      <article
        className={cn(
          OPERATOR_SURFACE_CARD_CLASS,
          "flex flex-col gap-3 border border-neutral-200 p-4 dark:border-neutral-800",
        )}
        data-testid="operator-home-create-architecture-card"
      >
        <div className="min-w-0 space-y-1">
          <h3 className={cn("m-0", OPERATOR_TYPE_SCALE.sectionTitle)}>{OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_TITLE}</h3>
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
            {OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_BODY}
          </p>
        </div>
        <Button asChild variant="primary" size="sm" className="h-8 w-fit">
          <Link href="/reviews/new" data-testid="operator-home-create-architecture-cta">
            {CREATE_ARCHITECTURE_LABEL}
          </Link>
        </Button>
      </article>

      <article
        className={cn(
          OPERATOR_SURFACE_CARD_CLASS,
          "flex flex-col gap-3 border-2 border-teal-800/25 p-4 dark:border-teal-500/30",
        )}
        data-testid="operator-home-review-architecture-card"
      >
        <div className="min-w-0 space-y-2">
          <StatusTag
            kind="ready"
            label={OPERATOR_HOME_RECOMMENDED_FIRST_BADGE}
            data-testid="operator-home-review-recommended-first"
          />
          <h3 className={cn("m-0", OPERATOR_TYPE_SCALE.sectionTitle)}>{OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_TITLE}</h3>
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
            {OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY}
          </p>
        </div>
        <Button asChild variant="primary" size="sm" className="h-8 w-fit">
          <Link href="/reviews/new" data-testid="operator-home-review-architecture-cta">
            {OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA}
          </Link>
        </Button>
      </article>
      </div>
    </div>
  );
}
