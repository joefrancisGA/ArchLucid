"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TRY_CLI_DEMO_CLI_HELP_HREF,
  TRY_CLI_DEMO_CLI_HELP_LABEL,
  TRY_CLI_DEMO_DISCLOSURE_SUMMARY,
  TRY_CLI_DEMO_REQUIREMENTS,
  buildTryCliDemoCommand,
} from "@/components/try-cli-demo-copy";
import { MARKETING_CANONICAL_DEMO_PATH } from "@/lib/marketing/marketing-entry-spine";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  parseTryCliDemoOpenFromSearch,
  tryCliDemoDisclosureHrefFromSearch,
} from "@/lib/administration/try-cli-demo-disclosure-url";

/** Optional local CLI workflow — collapsed by default on internal developer settings (TB-1898). */
export function TryCliDemoCard(props: { readonly hideCliHelpLink?: boolean }): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const tryCliDemoOpenParam = searchParams.get("tryCliDemoOpen");
  const commandLine = useMemo(() => buildTryCliDemoCommand(), []);
  const [copied, setCopied] = useState(false);
  const [disclosureOpen, setDisclosureOpenState] = useState(() => parseTryCliDemoOpenFromSearch(tryCliDemoOpenParam));

  const syncDisclosureOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(tryCliDemoDisclosureHrefFromSearch(searchParams.toString(), open, pathname), { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setDisclosureOpen = useCallback(
    (open: boolean) => {
      setDisclosureOpenState(open);
      syncDisclosureOpenToUrl(open);
    },
    [syncDisclosureOpenToUrl],
  );

  useEffect(() => {
    setDisclosureOpenState(parseTryCliDemoOpenFromSearch(tryCliDemoOpenParam));
  }, [tryCliDemoOpenParam]);

  async function copyCommand(): Promise<void> {
    try {
      await navigator.clipboard.writeText(commandLine);
      setCopied(true);
      showSuccess("Command copied.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showError("CLI demo", "Could not write to clipboard — copy manually.");
    }
  }

  return (
    <Card data-testid="try-cli-demo-card">
      <CardHeader>
        <CardTitle as="h3" className={OPERATOR_TYPOGRAPHY.cardTitle}>
          Local CLI demo
        </CardTitle>
        <CardDescription>
          Optional terminal workflow for engineers. Use browser preview for standard demos.
        </CardDescription>
      </CardHeader>
      <CardContent className={cn("space-y-3", OPERATOR_TYPOGRAPHY.body)}>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Preview a committed review record in the product UI before trying a local CLI run.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href={MARKETING_CANONICAL_DEMO_PATH} className={OPERATOR_LINK.nav}>
            Preview in browser
          </Link>
          {props.hideCliHelpLink ? null : (
            <Link
              href={TRY_CLI_DEMO_CLI_HELP_HREF}
              className={OPERATOR_LINK.nav}
              data-testid="try-cli-demo-cli-help-link"
            >
              {TRY_CLI_DEMO_CLI_HELP_LABEL}
            </Link>
          )}
        </div>

        <details
          className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
          data-testid="try-cli-demo-disclosure"
          open={disclosureOpen}
          onToggle={(event) => {
            setDisclosureOpen((event.currentTarget as HTMLDetailsElement).open);
          }}
        >
          <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {TRY_CLI_DEMO_DISCLOSURE_SUMMARY}
          </summary>
          <div className={cn("mt-3 space-y-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p
                className={cn(
                  "m-0 min-w-0 flex-1 font-mono rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900",
                  OPERATOR_TYPOGRAPHY.helper,
                )}
                data-testid="try-cli-demo-command"
              >
                {commandLine}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="try-cli-demo-copy-command"
                onClick={() => void copyCommand()}
              >
                {copied ? "Copied" : "Copy command"}
              </Button>
            </div>
            <p className="m-0">{TRY_CLI_DEMO_REQUIREMENTS}</p>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
