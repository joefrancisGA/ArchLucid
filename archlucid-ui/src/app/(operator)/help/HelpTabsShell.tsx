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
      <TabsList aria-label="Help sections" data-testid="help-tabs-shell-tablist">
        <TabsTrigger value="guide">Guides</TabsTrigger>
        <TabsTrigger value="docs">Documentation</TabsTrigger>
      </TabsList>
      <TabsContent value="guide" className="pt-0" data-testid="help-tabs-shell-panel-guide">
        {guide}
      </TabsContent>
      <TabsContent value="docs" className="pt-0" data-testid="help-tabs-shell-panel-docs">
        <p className={cn("mb-4", OPERATOR_TYPOGRAPHY.helper)}>
          Technical reference for configuration, CLI, API contracts, and admin diagnostics. Use the Guides tab for
          day-one product tasks first.
        </p>
        {docs}
      </TabsContent>
    </Tabs>
  );
}
