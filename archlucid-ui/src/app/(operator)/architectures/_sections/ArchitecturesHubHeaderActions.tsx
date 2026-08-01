"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture-routes";

/** Header actions for `/architectures`: help + primary Create architecture CTA. */
export function ArchitecturesHubHeaderActions(): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="architectures-hub-header-actions">
      <PageContextualHelpButton />
      <Button variant="primary" size="sm" asChild>
        <Link href={ARCHITECTURES_NEW_PATH} className="no-underline" data-testid="architectures-page-create">
          {CREATE_ARCHITECTURE_LABEL}
        </Link>
      </Button>
    </div>
  );
}
