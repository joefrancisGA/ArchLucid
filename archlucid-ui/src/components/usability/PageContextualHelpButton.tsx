"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { CircleHelp } from "lucide-react";
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

/** Contextual help for the current route — inline answers when migrated, otherwise `/help/{topic}`. */
export function PageContextualHelpButton(props: PageContextualHelpButtonProps = {}) {
  const pathname = usePathname() ?? "/";

  if (pathnameIsInAppHelpTopic(pathname)) {
    return null;
  }

  const topic = pageHelpTopicForPathname(pathname);
  const contextualEntry = contextualHelpForPathname(pathname);
  const learnMoreHref =
    topic?.slug != null && topic.slug.length > 0
      ? inAppHelpHref(topic.slug, topic.hashFragment)
      : null;

  if (contextualEntry !== null && topic !== null) {
    return (
      <PageScopedContextualHelpPanel
        entry={contextualEntry}
        triggerLabel={topic.label}
        triggerText={props.triggerText}
        learnMoreHref={learnMoreHref}
      />
    );
  }

  if (topic === null || learnMoreHref == null) {
    return null;
  }

  const accessibleName: string = `Help: ${topic.label}`;

  return (
    <Link
      href={learnMoreHref}
      className={PAGE_CONTEXTUAL_HELP_TRIGGER_CLASSNAME}
      data-testid="page-contextual-help-button"
      // Shortened text would otherwise leave the link named only "Help".
      aria-label={props.triggerText === undefined ? undefined : accessibleName}
    >
      <CircleHelp className="h-4 w-4" aria-hidden />
      <span className={cn("font-medium", OPERATOR_TYPOGRAPHY.helper)}>
        {props.triggerText ?? topic.label}
      </span>
    </Link>
  );
}
