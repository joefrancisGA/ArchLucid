"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import {
  ARCHLUCID_CTO_DEMO_STORY_CHANGED_EVENT,
  readBuyerCtoDemoStoryId,
  writeBuyerCtoDemoStoryId,
} from "@/lib/buyer/buyer-cto-demo-tour";
import { BUYER_CTO_DEMO_STORY_GATED_NOTE } from "@/lib/buyer/buyer-polish-copy";
import {
  CTO_DEMO_DEFAULT_STORY_ID,
  CTO_DEMO_STORIES,
  isCtoDemoStoryFullyBacked,
  type CtoDemoStory,
} from "@/lib/buyer/buyer-cto-demo-story-registry";

export type CtoDemoStorySelectorProps = {
  readonly selectedStoryId?: string;
  readonly onStoryChange?: (story: CtoDemoStory) => void;
};

export function CtoDemoStorySelector(props: CtoDemoStorySelectorProps): React.JSX.Element {
  const { selectedStoryId, onStoryChange } = props;
  const activeId = selectedStoryId ?? readBuyerCtoDemoStoryId();

  return (
    <div data-testid="cto-demo-story-selector">
      <p className={cn("m-0 mb-1 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{BUYER_CTO_DEMO_STORY_GATED_NOTE}</p>
      <div
        className="flex flex-wrap gap-1"
        role="group"
        aria-label="Demo vertical story (talk track only)"
      >
        {CTO_DEMO_STORIES.map((story) => {
          const selected = story.id === activeId;
          const fullyBacked = isCtoDemoStoryFullyBacked(story.id);

          return (
            <span key={story.id} className="inline-flex items-center gap-0.5">
              <button
                type="button"
                data-testid={`cto-demo-story-option-${story.id}`}
                className={cn("rounded-full border px-2 py-0.5 font-medium transition", OPERATOR_TYPOGRAPHY.helper,
                  selected
                    ? "border-teal-700 bg-teal-50 text-teal-900 dark:border-teal-600 dark:bg-teal-950/50 dark:text-teal-100"
                    : fullyBacked
                      ? "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                      : "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-500",
                )}
                aria-pressed={selected}
                disabled={!fullyBacked && !selected}
                onClick={() => {
                  if (!fullyBacked) {
                    return;
                  }

                  writeBuyerCtoDemoStoryId(story.id);
                  onStoryChange?.(story);

                  if (typeof window !== "undefined") {
                    window.dispatchEvent(
                      new CustomEvent(ARCHLUCID_CTO_DEMO_STORY_CHANGED_EVENT, {
                        detail: { storyId: story.id },
                      }),
                    );
                  }
                }}
              >
                {story.label}
              </button>
              {fullyBacked ? (
                <FieldHelpTooltip label={`${story.label} talk track`} hint={story.presenterLine} />
              ) : null}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export { CTO_DEMO_DEFAULT_STORY_ID };
