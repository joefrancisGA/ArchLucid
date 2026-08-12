"use client";

import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { useCreateArchitectureNavigation } from "@/hooks/use-create-architecture-navigation";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";

/** Header actions for `/architecture/architectures`: help + primary Create architecture (TB-1446). */
export function ArchitecturesHubHeaderActions(): React.JSX.Element {
  const createArchitectureNavigation = useCreateArchitectureNavigation();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="architectures-hub-header-actions">
      <PageContextualHelpButton />
      <Button
        type="button"
        variant="primary"
        size="sm"
        disabled={createArchitectureNavigation.isNavigating}
        aria-busy={createArchitectureNavigation.isNavigating}
        onClick={() => {
          createArchitectureNavigation.navigate();
        }}
        data-testid="architectures-page-create"
      >
        {createArchitectureNavigation.isNavigating
          ? createArchitectureNavigation.loadingLabel
          : CREATE_ARCHITECTURE_LABEL}
      </Button>
    </div>
  );
}
