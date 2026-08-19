"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";
import {
  TEAMS_NOTIFICATION_CATEGORIES,
  TEAMS_RECOMMENDED_EVENT_TYPES,
} from "@/lib/teams-integration-notification-catalog";
import { TEAMS_INTEGRATION_TRIGGER_REQUIRED } from "@/lib/teams-integration-page-copy";
import { cn } from "@/lib/utils";

type TeamsNotificationsSelectorProps = {
  readonly enabledTriggers: ReadonlySet<string>;
  readonly canMutate: boolean;
  readonly saving: boolean;
  readonly showValidationError: boolean;
  readonly onToggle: (eventType: string, checked: boolean) => void;
  readonly onSelectRecommended: () => void;
  readonly onSelectAll: () => void;
  readonly onClearAll: () => void;
};

/** Grouped notification opt-in controls for Microsoft Teams. */
export function TeamsNotificationsSelector(props: TeamsNotificationsSelectorProps): React.ReactElement {
  const [collapsedGroups, setCollapsedGroups] = useState<ReadonlySet<string>>(
    () =>
      new Set(
        TEAMS_NOTIFICATION_CATEGORIES.filter((category) => category.defaultCollapsed === true).map(
          (category) => category.id,
        ),
      ),
  );

  const mutationDisabledHintId = "teams-notifications-selector-mutate-disabled-hint";
  const mutationDisabledReason = props.canMutate ? null : whyDisabledEnterpriseMutationControl();

  return (
    <fieldset className="space-y-4">
      <legend className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Notifications to send</legend>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!props.canMutate || props.saving}
          aria-describedby={!props.canMutate ? mutationDisabledHintId : undefined}
          onClick={props.onSelectRecommended}
        >
          Select recommended
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!props.canMutate || props.saving}
          aria-describedby={!props.canMutate ? mutationDisabledHintId : undefined}
          onClick={props.onSelectAll}
        >
          Select all
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!props.canMutate || props.saving}
          aria-describedby={!props.canMutate ? mutationDisabledHintId : undefined}
          onClick={props.onClearAll}
        >
          Clear all
        </Button>
      </div>

      <WhyDisabledCtaHint
        id={mutationDisabledHintId}
        reason={mutationDisabledReason}
        testId={mutationDisabledHintId}
      />

      <div className="space-y-4">
        {TEAMS_NOTIFICATION_CATEGORIES.map((category) => {
          const collapsed = collapsedGroups.has(category.id);

          return (
            <section
              key={category.id}
              aria-labelledby={`teams-category-${category.id}`}
              className="rounded-md border border-neutral-200 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                <h3 id={`teams-category-${category.id}`} className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                  {category.title}
                </h3>
                {category.defaultCollapsed === true ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    aria-expanded={!collapsed}
                    onClick={() =>
                      setCollapsedGroups((prev) => {
                        const next = new Set(prev);

                        if (next.has(category.id)) {
                          next.delete(category.id);
                        } else {
                          next.add(category.id);
                        }

                        return next;
                      })
                    }
                  >
                    {collapsed ? "Show" : "Hide"}
                  </Button>
                ) : null}
              </div>

              {!collapsed ? (
                <ul className="m-0 list-none space-y-3 p-4">
                  {category.items.map((item) => {
                    const checkboxId = `teams-trigger-${item.eventType.replace(/\./g, "-")}`;
                    const checked = props.enabledTriggers.has(item.eventType);

                    return (
                      <li key={item.eventType}>
                        <label
                          htmlFor={checkboxId}
                          className={cn(
                            "flex min-h-11 cursor-pointer items-start gap-3 leading-snug",
                            OPERATOR_TYPOGRAPHY.body,
                          )}
                        >
                          <input
                            id={checkboxId}
                            type="checkbox"
                            checked={checked}
                            disabled={!props.canMutate || props.saving}
                            onChange={(event) => props.onToggle(item.eventType, event.target.checked)}
                            className="mt-1 h-4 w-4 shrink-0"
                            aria-describedby={`${checkboxId}-help`}
                          />
                          <span>
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-al-text-primary">{item.label}</span>
                              {item.recommended === true ? (
                                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
                                  Suggested
                                </span>
                              ) : null}
                            </span>
                            <span id={`${checkboxId}-help`} className="block text-al-text-secondary">
                              {item.description}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </section>
          );
        })}
      </div>

      {props.showValidationError ? (
        <p role="alert" className={cn("m-0 text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.body)}>
          {TEAMS_INTEGRATION_TRIGGER_REQUIRED}
        </p>
      ) : null}
    </fieldset>
  );
}

export { TEAMS_RECOMMENDED_EVENT_TYPES };
