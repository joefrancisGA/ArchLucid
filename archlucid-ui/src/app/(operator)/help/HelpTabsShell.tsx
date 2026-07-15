"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type HelpTabsShellProps = {
  readonly guide: ReactNode;
  readonly docs: ReactNode;
};

/** Default Help tab shows product guidance; documentation index stays secondary per UX review. */
export function HelpTabsShell({ guide, docs }: HelpTabsShellProps) {
  return (
    <Tabs defaultValue="guide" className="space-y-4">
      <TabsList
        aria-label="Help sections"
        className="gap-2 rounded-lg border border-neutral-200 bg-white/80 p-1 dark:border-neutral-800 dark:bg-neutral-950/80"
        data-testid="help-tabs-shell-tablist"
      >
        <TabsTrigger value="guide" className="rounded-md border-0 px-3 py-1.5">
          Product guide
        </TabsTrigger>
        <TabsTrigger value="docs" className="rounded-md border-0 px-3 py-1.5">
          Documentation
        </TabsTrigger>
      </TabsList>
      <TabsContent value="guide" className="pt-0" data-testid="help-tabs-shell-panel-guide">
        {guide}
      </TabsContent>
      <TabsContent value="docs" className="pt-0" data-testid="help-tabs-shell-panel-docs">
        <p className={cn("mb-4", OPERATOR_TYPOGRAPHY.helper)}>
          Repository and reference topics. Use the Product guide tab for day-one tasks first.
        </p>
        {docs}
      </TabsContent>
    </Tabs>
  );
}
