import Link from "next/link";

import { TryCliDemoCard } from "@/components/TryCliDemoCard";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** CLI and terminal workflows — reachable from Settings, not the governance onboarding path (TB-442). */
export default function DeveloperSettingsPage() {
  return (
    <div className="w-full max-w-3xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 h-8 px-0 text-teal-800 dark:text-teal-300">
          <Link href="/settings">← Settings</Link>
        </Button>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Developer tools</h1>
        <p className={cn("mt-1 max-w-prose", OPERATOR_TYPOGRAPHY.helper)}>
          Terminal workflows for technical users who prefer the CLI over the browser wizard.
        </p>
      </div>

      <TryCliDemoCard />
    </div>
  );
}
