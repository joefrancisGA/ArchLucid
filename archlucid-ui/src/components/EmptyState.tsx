import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { GettingStartedSteps } from "@/components/GettingStartedSteps";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type EmptyStateAction = {
  label: string;
  href: string;
  variant?: "primary" | "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
};

export type EmptyStateGettingStarted = {
  heading: string;
  steps: readonly string[];
};

export type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  helpTopicPath?: string;
  /** Optional first-run “how it works” list shown below the description. */
  gettingStarted?: EmptyStateGettingStarted;
};

/**
 * Centered empty collection / idle state with optional icon, CTAs, and help deep-link.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  helpTopicPath,
  gettingStarted,
}: EmptyStateProps) {
  const actionList = actions ?? [];

  return (
    <div role="status" aria-label={title} className="my-4">
      <Card className="border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/40">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-8 text-center">
          {Icon ? (
            <Icon className="h-12 w-12 shrink-0 text-teal-700 dark:text-teal-400" aria-hidden />
          ) : null}
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
          <p className="max-w-md text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{description}</p>
          {gettingStarted !== undefined ? (
            <GettingStartedSteps
              heading={gettingStarted.heading}
              steps={gettingStarted.steps}
              className="w-full max-w-lg"
            />
          ) : null}
          {actionList.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-3">
              {actionList.map((action, index) => {
                const isPrimary = index === 0 && action.variant === undefined;
                const variant = isPrimary ? "primary" : (action.variant ?? "outline");

                return (
                  <Button
                    key={`${action.href}-${action.label}`}
                    asChild
                    variant={variant}
                  >
                    <Link href={action.href}>{action.label}</Link>
                  </Button>
                );
              })}
            </div>
          ) : null}
          {helpTopicPath ? (
            <Link
              href={`/onboarding#${helpTopicPath}`}
              className="text-sm font-medium text-teal-800 underline dark:text-teal-300"
            >
              Learn more
            </Link>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
