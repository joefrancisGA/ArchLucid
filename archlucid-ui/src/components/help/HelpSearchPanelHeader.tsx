import { cn } from "@/lib/utils";

import { ContextualHelpDrawerBreadcrumb } from "@/components/help/ContextualHelpDrawerBreadcrumb";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HELP_SEARCH_PANEL_TITLE } from "@/lib/help/help-search-panel-catalog";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type HelpSearchPanelHeaderProps = {
  readonly subtitle: string;
};

/** Shared contextual help drawer hero — breadcrumb and buyer-safe subtitle (HCD). */
export function HelpSearchPanelHeader(props: HelpSearchPanelHeaderProps): React.JSX.Element {
  return (
    <DialogHeader className="shrink-0 space-y-2 border-b border-neutral-200 px-5 pb-3 pt-5 pr-12 text-left dark:border-neutral-800">
      <ContextualHelpDrawerBreadcrumb />
      <DialogTitle
        className="text-left text-lg text-neutral-900 dark:text-neutral-100"
        data-testid="help-search-panel-title"
      >
        {HELP_SEARCH_PANEL_TITLE}
      </DialogTitle>
      <DialogDescription className={cn("text-left", OPERATOR_TYPOGRAPHY.body)} data-testid="help-search-panel-subtitle">
        {props.subtitle}
      </DialogDescription>
    </DialogHeader>
  );
}
