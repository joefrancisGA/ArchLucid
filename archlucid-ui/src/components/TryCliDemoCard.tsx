"use client";

import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TRY_CLI_DEMO_COMMAND,
  TRY_CLI_DEMO_DISCLOSURE_SUMMARY,
  TRY_CLI_DEMO_REQUIREMENTS,
} from "@/components/try-cli-demo-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Optional local CLI workflow — collapsed by default on internal developer settings (TB-1898). */
export function TryCliDemoCard(): React.JSX.Element {
  return (
    <Card data-testid="try-cli-demo-card">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Local CLI demo</CardTitle>
        <CardDescription>
          Optional terminal workflow for engineers. Use browser preview for standard demos.
        </CardDescription>
      </CardHeader>
      <CardContent className={cn("space-y-3", OPERATOR_TYPOGRAPHY.body)}>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Preview a committed review record in the product UI before trying a local CLI run.
        </p>
        <Link href="/demo/preview" className={OPERATOR_LINK.nav}>
          Preview in browser
        </Link>

        <details className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800" data-testid="try-cli-demo-disclosure">
          <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {TRY_CLI_DEMO_DISCLOSURE_SUMMARY}
          </summary>
          <div className={cn("mt-3 space-y-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            <p
              className={cn(
                "m-0 font-mono rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900",
                OPERATOR_TYPOGRAPHY.helper,
              )}
              data-testid="try-cli-demo-command"
            >
              {TRY_CLI_DEMO_COMMAND}
            </p>
            <p className="m-0">{TRY_CLI_DEMO_REQUIREMENTS}</p>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
