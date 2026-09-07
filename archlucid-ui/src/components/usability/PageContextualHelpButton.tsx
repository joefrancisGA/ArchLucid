"use client";

import { usePathname } from "next/navigation";

import { contextualHelpForPathname } from "@/lib/contextual-help-registry";
import { pageHelpDrawerSupplementForSlug } from "@/lib/help/page-help-drawer-supplement";
import { WORKING_HOME_OPERATOR_HELP_SLUG } from "@/lib/help/help-workspace-mode-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { pageHelpTopicForPathname, pathnameIsInAppHelpTopic } from "@/lib/usability/page-help-topic-map";
import { PAGE_CONTEXTUAL_HELP_TRIGGER_CLASSNAME } from "@/components/usability/page-contextual-help-trigger";
import { PageScopedContextualHelpPanel } from "@/components/usability/PageScopedContextualHelpPanel";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";

/**
 * Short visible trigger text for headers whose title already names the help topic.
 * Pass as `triggerText` — the topic still reaches assistive tech via the accessible name.
 */
export const PAGE_HELP_SHORT_TRIGGER_TEXT = "Help";

export { PAGE_CONTEXTUAL_HELP_TRIGGER_CLASSNAME };

export type PageContextualHelpButtonProps = {
  /** Visible trigger text; defaults to the topic label. */
  readonly triggerText?: string;
};

/** Contextual help for the current route — non-modal right drawer with Category-1 answers and a full-help link. */
export function PageContextualHelpButton(props: PageContextualHelpButtonProps = {}) {
  const pathname = usePathname() ?? "/";
  const { isWorkingMode } = useWorkspaceMode();

  if (pathnameIsInAppHelpTopic(pathname)) {
    return null;
  }

  const topic = pageHelpTopicForPathname(pathname);

  if (topic === null) {
    return null;
  }

  const contextualEntry = contextualHelpForPathname(pathname, { workingMode: isWorkingMode });
  const learnMoreSlug =
    isWorkingMode && pathname.split("?")[0] === "/"
      ? WORKING_HOME_OPERATOR_HELP_SLUG
      : topic.slug;
  const learnMoreHref =
    learnMoreSlug != null && learnMoreSlug.length > 0
      ? inAppHelpHref(learnMoreSlug, topic.hashFragment)
      : null;

  const supplement = pageHelpDrawerSupplementForSlug(topic.slug);

  return (
    <PageScopedContextualHelpPanel
      entry={contextualEntry}
      triggerLabel={topic.label}
      triggerText={props.triggerText}
      learnMoreHref={learnMoreHref}
      supplement={supplement}
      sectionId={topic.hashFragment}
    />
  );
}
