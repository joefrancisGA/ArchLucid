import { cn } from "@/lib/utils";
import Link from "next/link";

import { StatusTag } from "@/components/ui/status-tag";
import { ARCHITECTURE_CREATED_CONFIRMATION, ARCHITECTURE_CREATED_OVERFLOW_LABEL } from "@/lib/architecture/architecture-created-home-copy";
import type { ArchitectureCreatedHomeModel } from "@/lib/architecture/architecture-created-home-model";
import { readArchitectureWorkspaceTabFromHref, type ArchitectureWorkspaceTabId } from "@/lib/architecture/architecture-workspace-tabs";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ArchitectureCreatedWorkspaceHeaderProps = {
  readonly model: ArchitectureCreatedHomeModel;
  readonly activeTab: ArchitectureWorkspaceTabId;
  readonly onNavigateTab: (tab: ArchitectureWorkspaceTabId) => void;
};

export function ArchitectureCreatedWorkspaceHeader(
  props: ArchitectureCreatedWorkspaceHeaderProps,
): React.JSX.Element {
  const { model, activeTab, onNavigateTab } = props;

  return (
    <header
      className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-200 pb-4 dark:border-neutral-800"
      data-testid="architecture-created-workspace-header"
    >
      <div className="min-w-0 space-y-2">
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {ARCHITECTURE_CREATED_CONFIRMATION}
        </p>
        <h1
          className={cn(
            "m-0 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl",
          )}
          data-testid="architecture-created-workspace-title"
        >
          {model.architectureName}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <StatusTag kind={model.lifecycleStatusTagKind} label={model.lifecycleLabel} />
          {model.ownerLabel !== null ? (
            <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Owner: {model.ownerLabel}
            </span>
          ) : null}
          <span className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Updated {model.lastUpdatedLabel}
          </span>
        </div>
      </div>

      <details className="relative">
        <summary
          className={cn(
            "cursor-pointer list-none rounded-md border border-neutral-200 px-3 py-1.5 font-medium text-neutral-700 dark:border-neutral-700 dark:text-neutral-200",
            OPERATOR_TYPOGRAPHY.helper,
          )}
          data-testid="architecture-created-overflow-menu"
        >
          {ARCHITECTURE_CREATED_OVERFLOW_LABEL}
        </summary>
        <div className="absolute right-0 z-10 mt-2 min-w-[12rem] rounded-md border border-neutral-200 bg-white p-2 shadow-md dark:border-neutral-700 dark:bg-neutral-950">
          <ul className="m-0 list-none space-y-1 p-0">
            {model.overflowActions.map((action) => {
              const tab = readArchitectureWorkspaceTabFromHref(action.href);
              const isCurrentTab = tab !== null && tab === activeTab;

              return (
                <li key={`${action.label}-${action.href}`}>
                  {tab !== null ? (
                    <button
                      type="button"
                      className={cn(
                        "block w-full rounded px-2 py-1.5 text-left dark:hover:bg-neutral-900",
                        isCurrentTab
                          ? "cursor-default bg-neutral-100 font-semibold text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
                          : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200",
                        OPERATOR_TYPOGRAPHY.helper,
                      )}
                      aria-current={isCurrentTab ? "page" : undefined}
                      disabled={isCurrentTab}
                      onClick={() => {
                        if (isCurrentTab) {
                          return;
                        }

                        onNavigateTab(tab);
                      }}
                    >
                      {isCurrentTab ? `${action.label} (current)` : action.label}
                    </button>
                  ) : (
                    <Link
                      href={action.href}
                      className={cn(
                        "block rounded px-2 py-1.5 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-900",
                        OPERATOR_TYPOGRAPHY.helper,
                      )}
                    >
                      {action.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </details>
    </header>
  );
}
