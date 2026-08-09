"use client";

import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { useCreateArchitectureNavigation } from "@/hooks/use-create-architecture-navigation";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";

/** Header actions for `/architecture/architectures`: help + Create architecture when drafts already exist. */
export function ArchitecturesHubHeaderActions(): React.JSX.Element {
  const draftEntries = useArchitectureDraftRegistryEntries();
  const createArchitectureNavigation = useCreateArchitectureNavigation();
  const showCreateAction = draftEntries.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="architectures-hub-header-actions">
      <PageContextualHelpButton />
      {showCreateAction ? (
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
      ) : null}
    </div>
  );
}
