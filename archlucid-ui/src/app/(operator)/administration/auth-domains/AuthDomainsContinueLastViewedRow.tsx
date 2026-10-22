"use client";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY, OPERATOR_RESUME } from "@/lib/design-tokens";
import type { AuthDomainsContinueLastTarget } from "@/lib/resolve-continue-last-auth-domain";
import { cn } from "@/lib/utils";

export type AuthDomainsContinueLastViewedRowProps = {
  readonly target: AuthDomainsContinueLastTarget;
  readonly onOpen: (normalizedDomain: string) => void;
};

/** Pinned continue row for the most recently viewed auth domain. */
export function AuthDomainsContinueLastViewedRow(
  props: AuthDomainsContinueLastViewedRowProps,
): React.JSX.Element {
  return (
    <section
      aria-labelledby="auth-domains-continue-last-viewed-heading"
      className={OPERATOR_RESUME.stripSpaced}
      data-testid="auth-domains-continue-last-viewed-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="auth-domains-continue-last-viewed-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Continue last viewed domain
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">{props.target.displayDomain}</span>
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          data-testid="auth-domains-continue-last-viewed-open"
          onClick={() => {
            props.onOpen(props.target.normalizedDomain);
          }}
        >
          Open domain
        </Button>
      </div>
    </section>
  );
}
