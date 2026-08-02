"use client";

import { AuthorityThemeDevSelector } from "@/components/settings/AuthorityThemeDevSelector";
import { TryCliDemoCard } from "@/components/TryCliDemoCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { INTERNAL_DEVELOPER_TOOLS_INTRO } from "./developer-settings-copy";

/** Internal operator developer tools — not linked from customer settings navigation. */
export function DeveloperSettingsPageClient() {
  return (
    <div className="w-full max-w-3xl space-y-6" data-testid="developer-settings-page">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 h-8 px-0 text-teal-800 dark:text-teal-300">
          <Link href="/administration/settings">← Settings</Link>
        </Button>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Internal developer tools</h1>
        <p className={cn("mt-1 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {INTERNAL_DEVELOPER_TOOLS_INTRO}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Branded theme evaluation</CardTitle>
        </CardHeader>
        <CardContent>
          <AuthorityThemeDevSelector />
        </CardContent>
      </Card>

      <TryCliDemoCard />
    </div>
  );
}
