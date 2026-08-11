"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildDecisionRegisterEmptyTeaching,
  type DecisionRegisterEmptyTeachingModel,
} from "@/lib/decision-register-empty-teaching";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type DecisionRegisterEmptyTeachingProps = {
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildDecisionRegisterEmptyTeaching}. */
  readonly model?: DecisionRegisterEmptyTeachingModel;
};

/**
 * TB-2263 — Empty Decision register teaching strip.
 * Mount inside the Decision register empty shell so operators learn empty ≠ no findings.
 */
export function DecisionRegisterEmptyTeaching(
  props: DecisionRegisterEmptyTeachingProps,
): JSX.Element {
  const model = props.model ?? buildDecisionRegisterEmptyTeaching();
  const actions =
    model.actions === null || model.actions === undefined
      ? []
      : model.actions.filter((action) => {
          if (action === null || action === undefined) {
            return false;
          }

          if (action.href.trim().length === 0) {
            return false;
          }

          return action.label.trim().length > 0;
        });

  return (
    <div
      role="status"
      aria-label={model.title}
      data-testid="decision-register-empty-teaching"
      className={cn(
        "rounded-md border border-dashed border-neutral-200 px-3 py-3 dark:border-neutral-700",
        OPERATOR_LAYOUT.sectionStack,
        props.className,
      )}
    >
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle, "text-al-text-primary")}>
        {model.title}
      </p>
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-neutral-600 dark:text-neutral-400")}>
        {model.body}
      </p>
      <p
        className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-neutral-600 dark:text-neutral-400")}
        data-testid="decision-register-empty-teaching-honesty"
      >
        {model.honestyLine}
      </p>
      {actions.length > 0 ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
          {actions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className={cn(OPERATOR_LINK.inline, OPERATOR_TYPE_SCALE.helper, "font-medium")}
              data-testid={`decision-register-empty-teaching-action-${action.id}`}
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
