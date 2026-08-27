"use client";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY, OPERATOR_RESUME } from "@/lib/design-tokens";
import type { RecycleBinContinueLastTarget } from "@/lib/resolve-continue-last-recycle-bin-project";
import { cn } from "@/lib/utils";

export type ProjectsRecycleBinContinueLastViewedRowProps = {
  readonly target: RecycleBinContinueLastTarget;
  readonly onOpen: (target: RecycleBinContinueLastTarget) => void;
};

/** Pinned continue row for the most recently viewed deleted project. */
export function ProjectsRecycleBinContinueLastViewedRow(
  props: ProjectsRecycleBinContinueLastViewedRowProps,
): React.JSX.Element {
  return (
    <section
      aria-labelledby="projects-recycle-bin-continue-last-viewed-heading"
      className={OPERATOR_RESUME.stripSpaced}
      data-testid="projects-recycle-bin-continue-last-viewed-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="projects-recycle-bin-continue-last-viewed-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Continue last viewed project
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">{props.target.projectName}</span>
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          data-testid="projects-recycle-bin-continue-last-viewed-open"
          onClick={() => {
            props.onOpen(props.target);
          }}
        >
          Open project
        </Button>
      </div>
    </section>
  );
}
