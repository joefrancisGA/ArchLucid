"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ReviewPresenterSurfaceProps = {
  readonly title: string;
  readonly body: React.ReactNode;
  readonly actions?: React.ReactNode;
  readonly onExit: () => void;
};

/** Conference-room layout: one primary object, audience-safe vocabulary (PT-15). */
export function ReviewPresenterSurface(props: ReviewPresenterSurfaceProps): React.JSX.Element {
  useEffect(() => {
    document.documentElement.setAttribute("data-review-presenter", "1");

    return () => {
      document.documentElement.removeAttribute("data-review-presenter");
    };
  }, []);

  return (
    <div
      className="min-h-[70vh] space-y-8 rounded-lg border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="review-presenter-surface"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Presenter</p>
        <Button type="button" variant="outline" size="sm" data-testid="review-presenter-exit" onClick={props.onExit}>
          Exit presenter
        </Button>
      </div>
      <div className="mx-auto max-w-5xl space-y-6 text-center">
        <h1
          className={cn(
            "m-0 font-semibold text-neutral-900 dark:text-neutral-100",
            "text-3xl leading-tight md:text-4xl",
          )}
        >
          {props.title}
        </h1>
        <div className={cn("text-left text-lg leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {props.body}
        </div>
        {props.actions !== undefined ? (
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">{props.actions}</div>
        ) : null}
      </div>
    </div>
  );
}
