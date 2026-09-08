"use client";

import Link from "next/link";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { OPERATOR_LINK } from "@/lib/design-tokens";
import { REVIEWS_NEW_GUIDED_INTAKE_HREF, REVIEWS_NEW_GUIDED_QUESTIONS_LABEL } from "@/lib/reviews-new-path-copy";

/** Header actions for `/architecture/architectures/new` (TB-1458). */
export function ArchitecturesNewPageHeaderActions(): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="architectures-new-page-header-actions">
      {isWorkingMode ? (
        <Link
          href={REVIEWS_NEW_GUIDED_INTAKE_HREF}
          className={OPERATOR_LINK.nav}
          data-testid="architectures-new-guided-intake-secondary"
        >
          {REVIEWS_NEW_GUIDED_QUESTIONS_LABEL}
        </Link>
      ) : null}
      <PageContextualHelpButton />
    </div>
  );
}
