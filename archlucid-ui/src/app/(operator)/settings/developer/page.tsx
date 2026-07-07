"use client";

import Link from "next/link";

import { AuthorityThemeDevSelector } from "@/components/settings/AuthorityThemeDevSelector";
import { TryCliDemoCard } from "@/components/TryCliDemoCard";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Internal CLI, theme preview, and terminal workflows — not shown on the customer Settings index (TB-442). */
export default function DeveloperSettingsPage() {
  const internalShell = isArchLucidInternalOperatorShellEnv();

  if (!internalShell) {
    return (
      <div className="w-full max-w-3xl space-y-6" data-testid="developer-settings-forbidden">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 h-8 px-0 text-teal-800 dark:text-teal-300">
            <Link href="/settings">← Settings</Link>
          </Button>
          <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Developer tools</h1>
          <p className={cn("mt-1 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="alert">
            Developer tools are not available in this workspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl space-y-6" data-testid="developer-settings-page">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 h-8 px-0 text-teal-800 dark:text-teal-300">
          <Link href="/settings">← Settings</Link>
        </Button>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Developer tools</h1>
        <p className={cn("mt-1 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Internal tools for local demos, diagnostics, and support workflows.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Visual theme (developer preview)</CardTitle>
        </CardHeader>
        <CardContent>
          <AuthorityThemeDevSelector />
        </CardContent>
      </Card>

      <TryCliDemoCard />
    </div>
  );
}
