"use client";

import Link from "next/link";

import { ShortcutHint } from "@/components/ShortcutHint";
import { Button } from "@/components/ui/button";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import {
  REVIEWS_HUB_CREATE_ARCHITECTURE_HELPER_LINK,
  REVIEWS_HUB_CREATE_ARCHITECTURE_HELPER_PREFIX,
  REVIEWS_HUB_PRIMARY_START_LABEL,
} from "./reviews-hub-copy";

/** Primary review workflow action for the `/reviews` hub. */
export function ReviewsHubPrimaryActions(): React.JSX.Element {
  const fullShell = isOperatorExperienceFullShellEnv();

  return (
    <section className="mt-4 space-y-2" data-testid="reviews-hub-primary-actions" aria-label="Start a review package">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1.5">
          <Button variant="primary" size="sm" asChild>
            <Link href="/reviews/new" className="no-underline" data-testid="runs-page-start-review">
              {REVIEWS_HUB_PRIMARY_START_LABEL}
            </Link>
          </Button>
          {fullShell ? <ShortcutHint shortcut="Alt+N" className={OPERATOR_TYPOGRAPHY.helper} /> : null}
        </div>
      </div>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="reviews-hub-create-architecture-helper">
        {REVIEWS_HUB_CREATE_ARCHITECTURE_HELPER_PREFIX}{" "}
        <Link href="/reviews/new" className={OPERATOR_LINK.nav}>
          {REVIEWS_HUB_CREATE_ARCHITECTURE_HELPER_LINK}
        </Link>
        .
      </p>
    </section>
  );
}
