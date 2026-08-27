"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY, OPERATOR_RESUME } from "@/lib/design-tokens";
import type { CloudConnectionsContinueLastTarget } from "@/lib/resolve-continue-last-cloud-provider";
import { writeCloudProviderLastViewedId } from "@/lib/resolve-continue-last-cloud-provider";
import { cn } from "@/lib/utils";

export type CloudConnectionsContinueLastViewedRowProps = {
  readonly target: CloudConnectionsContinueLastTarget;
};

/** Pinned continue row for the most recently viewed cloud provider. */
export function CloudConnectionsContinueLastViewedRow(
  props: CloudConnectionsContinueLastViewedRowProps,
): React.JSX.Element {
  return (
    <section
      aria-labelledby="cloud-connections-continue-last-viewed-heading"
      className={OPERATOR_RESUME.stripSpaced}
      data-testid="cloud-connections-continue-last-viewed-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="cloud-connections-continue-last-viewed-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Continue last viewed provider
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">{props.target.name}</span>
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          asChild
          data-testid="cloud-connections-continue-last-viewed-open"
        >
          <Link
            href={props.target.href}
            onClick={() => {
              writeCloudProviderLastViewedId(props.target.provider);
            }}
          >
            Open provider
          </Link>
        </Button>
      </div>
    </section>
  );
}
