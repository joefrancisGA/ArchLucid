"use client";

import { usePathname } from "next/navigation";

import { contextualHelpForPathname } from "@/lib/contextual-help-registry";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { pageHelpTopicForPathname, pathnameIsInAppHelpTopic } from "@/lib/usability/page-help-topic-map";
import { PAGE_CONTEXTUAL_HELP_TRIGGER_CLASSNAME } from "@/components/usability/page-contextual-help-trigger";
import { PageScopedContextualHelpPanel } from "@/components/usability/PageScopedContextualHelpPanel";

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

  if (pathnameIsInAppHelpTopic(pathname)) {
    return null;
  }

  const topic = pageHelpTopicForPathname(pathname);

  if (topic === null) {
    return null;
  }

  const contextualEntry = contextualHelpForPathname(pathname);
  const learnMoreHref =
    topic.slug != null && topic.slug.length > 0
      ? inAppHelpHref(topic.slug, topic.hashFragment)
      : null;

  return (
    <PageScopedContextualHelpPanel
      entry={contextualEntry}
      triggerLabel={topic.label}
      triggerText={props.triggerText}
      learnMoreHref={learnMoreHref}
      sectionId={topic.hashFragment}
    />
  );
}
