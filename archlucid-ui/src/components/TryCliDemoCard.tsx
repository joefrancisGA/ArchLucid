"use client";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InAppHelpLink } from "@/components/InAppHelpLink";

/** Surfaces the CLI `archlucid try` path for evaluators who prefer terminal workflows. */
export function TryCliDemoCard(): React.JSX.Element {
  return (
    <Card data-testid="try-cli-demo-card">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.body}>Try with CLI (no Docker required)</CardTitle>
        <CardDescription>
          Clone a demo repo, run one architecture review, and produce a committed review record plus Markdown report in a single command.
        </CardDescription>
      </CardHeader>
      <CardContent className={cn("space-y-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        <p className={cn("m-0 font-mono rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900", OPERATOR_TYPOGRAPHY.helper)}>
          archlucid try --api-base-url http://localhost:5128
        </p>
        <p className="m-0">
          Requires .NET SDK and a running API. Scope headers are read from <code className={OPERATOR_TYPOGRAPHY.helper}>archlucid.json</code> when present.
        </p>
        <InAppHelpLink helpSlug="cli-usage" label="CLI usage guide" variant="text" />
        {" · "}
        <Link href="/demo/preview" className="font-medium text-teal-800 underline dark:text-teal-300">
          Or preview in browser
        </Link>
      </CardContent>
    </Card>
  );
}
