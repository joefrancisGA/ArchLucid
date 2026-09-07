import Link from "next/link";

import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import {
  ARCHITECTURE_IDENTITY_DESK_VERSIONS_EMPTY,
  ARCHITECTURE_IDENTITY_DESK_VERSIONS_HONESTY,
  ARCHITECTURE_IDENTITY_DESK_VERSIONS_SECTION_TITLE,
} from "@/lib/architecture/architecture-identity-desk-copy";
import { resolveArchitectureReviewHref } from "@/lib/architecture/architecture-routes";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatInventoryUpdatedAtCell } from "@/lib/relative-time";
import type { ArchitectureIdentityVersionSummary } from "@/types/architecture-identity";

type ArchitectureIdentityDeskVersionsSectionProps = {
  readonly architectureId: string;
  readonly versions: readonly ArchitectureIdentityVersionSummary[];
};

/** Read-only architecture version lattice on the identity desk (CA-29). */
export function ArchitectureIdentityDeskVersionsSection(
  props: ArchitectureIdentityDeskVersionsSectionProps,
): React.JSX.Element {
  return (
    <section
      aria-labelledby="architecture-identity-versions-heading"
      className="space-y-2"
      data-testid="architecture-identity-versions-section"
    >
      <h2 id="architecture-identity-versions-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
        {ARCHITECTURE_IDENTITY_DESK_VERSIONS_SECTION_TITLE}
      </h2>
      <p className={OPERATOR_TYPOGRAPHY.helper}>{ARCHITECTURE_IDENTITY_DESK_VERSIONS_HONESTY}</p>

      {props.versions.length === 0 ? (
        <p className={OPERATOR_TYPOGRAPHY.body} data-testid="architecture-identity-versions-empty">
          {ARCHITECTURE_IDENTITY_DESK_VERSIONS_EMPTY}
        </p>
      ) : (
        <EnterpriseTable ariaLabel="Architecture versions" data-testid="architecture-identity-versions-table">
          <EnterpriseTableHead>
            <EnterpriseTableHeadRow>
              <EnterpriseTableHeaderCell>Version</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Created</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Review</EnterpriseTableHeaderCell>
            </EnterpriseTableHeadRow>
          </EnterpriseTableHead>
          <EnterpriseTableBody>
            {props.versions.map((version) => {
              const linkedReviewId = version.linkedReviewId?.trim() ?? "";

              return (
                <EnterpriseTableRow
                  key={version.architectureVersionId}
                  data-testid={`architecture-identity-version-row-${version.versionNumber}`}
                >
                  <EnterpriseTableCell>{version.versionNumber}</EnterpriseTableCell>
                  <EnterpriseTableCell>{formatInventoryUpdatedAtCell(version.createdUtc).display}</EnterpriseTableCell>
                  <EnterpriseTableCell>
                    {linkedReviewId.length > 0 ? (
                      <Link
                        href={resolveArchitectureReviewHref(linkedReviewId, props.architectureId)}
                        className={OPERATOR_LINK.nav}
                      >
                        Open review
                      </Link>
                    ) : (
                      "—"
                    )}
                  </EnterpriseTableCell>
                </EnterpriseTableRow>
              );
            })}
          </EnterpriseTableBody>
        </EnterpriseTable>
      )}
    </section>
  );
}
