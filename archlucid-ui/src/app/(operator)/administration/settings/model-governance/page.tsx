import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { ModelGovernanceSettingsCard } from "./_sections/ModelGovernanceSettingsCard";

/** Admin workspace model governance: default execution profile, alias registry, and profile mappings (TB-871). */
export default function ModelGovernanceSettingsPage() {
  return (
    <div className="w-full max-w-4xl space-y-6 p-6" data-testid="model-governance-settings-page">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 h-8 px-0 text-teal-800 dark:text-teal-300">
          <Link href="/administration/settings">← Settings</Link>
        </Button>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>AI and model governance</h1>
        <p className={cn("mt-1 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Manage the workspace default execution profile and review governed model aliases used on reviews.
        </p>
      </div>
      <ModelGovernanceSettingsCard />
    </div>
  );
}
