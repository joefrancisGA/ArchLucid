import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_ARTICLE_LOADING_STATUS } from "@/lib/help/help-search-panel-catalog";

const SKELETON_BLOCK_CLASS = "h-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800";

/** Preserves inline article layout while a help topic loads in the drawer. */
export function HelpArticleSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-3" data-testid="help-article-skeleton" aria-busy="true">
      <div className={cn(SKELETON_BLOCK_CLASS, "w-2/3")} />
      <div className={cn(SKELETON_BLOCK_CLASS, "w-full")} />
      <div className={cn(SKELETON_BLOCK_CLASS, "w-full")} />
      <div className={cn(SKELETON_BLOCK_CLASS, "w-5/6")} />
      <p className={cn("m-0 pt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="status">
        {HELP_ARTICLE_LOADING_STATUS}
      </p>
    </div>
  );
}
