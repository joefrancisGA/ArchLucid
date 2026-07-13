import type { Metadata } from "next";

import { ArchitectureDraftListClient } from "@/components/architecture/ArchitectureDraftListClient";
import { ArchitectureDraftGuidanceDisclosure } from "@/components/architecture/ArchitectureDraftGuidanceDisclosure";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture-routes";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Architectures",
};

export default function ArchitecturesListPage(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="workflow">
      <div className="mt-6 mb-1 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>Architectures</h2>
        <div className="flex flex-wrap items-center gap-2">
          <PageContextualHelpButton />
          <Link
            href={ARCHITECTURES_NEW_PATH}
            className="text-sm font-medium text-teal-800 underline dark:text-teal-300"
          >
            {CREATE_ARCHITECTURE_LABEL}
          </Link>
        </div>
      </div>
      <ArchitectureDraftGuidanceDisclosure className="mb-3" />
      <p className={cn("mt-1 max-w-prose", OPERATOR_TYPOGRAPHY.helper)}>
        Resume saved architecture drafts. Saving a draft does not start a review.
      </p>
      <div className="mt-4">
        <ArchitectureDraftListClient />
      </div>
    </OperatorPageContainer>
  );
}
