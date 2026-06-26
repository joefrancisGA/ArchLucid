"use client";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

/** Contextual help link for the current route — maps to `/help/{topic}`. */
export function PageContextualHelpButton() {
  const pathname = usePathname() ?? "/";
  const topic = pageHelpTopicForPathname(pathname);

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
