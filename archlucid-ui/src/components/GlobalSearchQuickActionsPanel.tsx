"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";
import { OPEN_COMMAND_PALETTE_EVENT } from "@/lib/shortcut-registry";

type GlobalSearchQuickActionsPanelProps = {
  readonly inputId: string;
  readonly onClose: () => void;
};

export function GlobalSearchQuickActionsPanel(props: GlobalSearchQuickActionsPanelProps) {
  return (
    <div
      id={`${props.inputId}-results`}
      role="dialog"
      aria-label="Quick actions"
      className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-md border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-950"
      data-testid="global-search-quick-actions"
    >
      <section className="px-3 py-2">
        <h3 className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
          Quick actions
        </h3>
        <ul className="m-0 mt-1 list-none p-0">
          <li>
            <button
              type="button"
              className={cn("w-full rounded px-1 py-1.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-900", OPERATOR_TYPOGRAPHY.body)}
              onClick={() => {
                window.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE_EVENT));
                props.onClose();
              }}
            >
              Command palette
              <span className={cn("mt-0.5 block text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
                Jump to any page, review, or task
              </span>
            </button>
          </li>
          <li>
            <Link
              href={ASK_REVIEW_QUESTIONS_PATH}
              className={cn("block rounded px-1 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-900", OPERATOR_TYPOGRAPHY.body)}
              onClick={() => props.onClose()}
            >
              Ask review questions
              <span className={cn("mt-0.5 block text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
                Scoped Q&amp;A over review evidence
              </span>
            </Link>
          </li>
          <li>
            <Link
              href={SEARCH_REVIEW_EVIDENCE_PATH}
              className={cn("block rounded px-1 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-900", OPERATOR_TYPOGRAPHY.body)}
              onClick={() => props.onClose()}
            >
              Search review evidence
              <span className={cn("mt-0.5 block text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
                Search the evidence trail across reviews
              </span>
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
