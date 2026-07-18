"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { contextualHelpForPathname } from "@/lib/contextual-help-registry";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";
import { PageScopedContextualHelpPanel } from "@/components/usability/PageScopedContextualHelpPanel";

/** Contextual help for the current route — inline answers when migrated, otherwise `/help/{topic}`. */
export function PageContextualHelpButton() {
  const pathname = usePathname() ?? "/";
  const topic = pageHelpTopicForPathname(pathname);
  const contextualEntry = contextualHelpForPathname(pathname);

  if (contextualEntry !== null && topic !== null) {
    return (
      <PageScopedContextualHelpPanel
        entry={contextualEntry}
        triggerLabel={topic.label}
        learnMoreHref={`/help/${topic.slug}`}
      />
    );
  }

  if (topic === null) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 gap-1.5 px-2 text-neutral-700 dark:text-neutral-300"
      asChild
      data-testid="page-contextual-help-button"
    >
      <Link href={`/help/${topic.slug}`} title={`Help: ${topic.label}`}>
        <CircleHelp className="h-4 w-4" aria-hidden />
        <span className={cn("font-medium", OPERATOR_TYPOGRAPHY.helper)}>{topic.label}</span>
      </Link>
    </Button>
  );
}
