"use client";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";

/** Header actions for `/architecture/architectures/new` (TB-1458). */
export function ArchitecturesNewPageHeaderActions(): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="architectures-new-page-header-actions">
      <PageContextualHelpButton />
    </div>
  );
}
