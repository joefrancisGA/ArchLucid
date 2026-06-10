"use client";

import {
  ARCHLUCID_CTO_DEMO_STORY_CHANGED_EVENT,
  readBuyerCtoDemoStoryId,
  writeBuyerCtoDemoStoryId,
} from "@/lib/buyer-cto-demo-tour";
import {
  CTO_DEMO_DEFAULT_STORY_ID,
  CTO_DEMO_STORIES,
  type CtoDemoStory,
} from "@/lib/buyer-cto-demo-story-registry";
import { cn } from "@/lib/utils";

export type CtoDemoStorySelectorProps = {
  readonly selectedStoryId?: string;
  readonly onStoryChange?: (story: CtoDemoStory) => void;
};

export function CtoDemoStorySelector(props: CtoDemoStorySelectorProps): React.JSX.Element {
  const { selectedStoryId, onStoryChange } = props;
  const activeId = selectedStoryId ?? readBuyerCtoDemoStoryId();

  return (
    <div
      className="mt-2 flex flex-wrap gap-1"
      data-testid="cto-demo-story-selector"
      role="group"
      aria-label="Demo vertical story"
    >
      {CTO_DEMO_STORIES.map((story) => {
        const selected = story.id === activeId;

        return (
          <button
            key={story.id}
            type="button"
            data-testid={`cto-demo-story-option-${story.id}`}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[11px] font-medium transition",
              selected
                ? "border-teal-700 bg-teal-50 text-teal-900 dark:border-teal-600 dark:bg-teal-950/50 dark:text-teal-100"
                : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300",
            )}
            aria-pressed={selected}
            onClick={() => {
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
        );
      })}
    </div>
  );
}

export { CTO_DEMO_DEFAULT_STORY_ID };
