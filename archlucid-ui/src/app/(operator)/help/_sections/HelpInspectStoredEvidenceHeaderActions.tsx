"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PRIMARY_ACTION } from "@/lib/evidence-source-inspect-help-stored-evidence-guide-content";
import { EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TECHNICAL_REFERENCE_HEADING_ID } from "@/lib/evidence-source-inspect-help-stored-evidence-guide-content";
import { helpInspectStoredEvidenceTechnicalReferenceHrefFromSearch } from "@/lib/help/help-inspect-stored-evidence-technical-reference-url";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type HelpInspectStoredEvidenceHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/inspect-stored-evidence` (ESI-08 / EIN). */
export function HelpInspectStoredEvidenceHeaderActions(
  props: HelpInspectStoredEvidenceHeaderActionsProps,
): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/help/inspect-stored-evidence";
  const searchParams = useSearchParams();

  const openTechnicalReferenceBeforePrint = useCallback(async () => {
    router.replace(
      helpInspectStoredEvidenceTechnicalReferenceHrefFromSearch(searchParams.toString(), true, pathname),
      { scroll: false },
    );

    document.getElementById(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TECHNICAL_REFERENCE_HEADING_ID)?.setAttribute(
      "open",
      "",
    );

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => resolve());
      });
    });
  }, [pathname, router, searchParams]);

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-inspect-stored-evidence-header-actions">
      <Button
        asChild
        data-testid={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PRIMARY_ACTION.testId}
        size="sm"
        variant="outline"
      >
        <Link href={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PRIMARY_ACTION.href}>
          {EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PRIMARY_ACTION.label}
        </Link>
      </Button>
      <HelpTopicPrintButton
        entry={props.entry}
        allowWithoutServerPdf
        onBeforePrint={openTechnicalReferenceBeforePrint}
      />
    </div>
  );
}
