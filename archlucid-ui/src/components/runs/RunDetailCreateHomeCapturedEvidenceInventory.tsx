import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  RUN_DETAIL_CREATE_HOME_CAPTURED_EVIDENCE_EMPTY_DESCRIPTION,
  RUN_DETAIL_CREATE_HOME_CAPTURED_EVIDENCE_EMPTY_TITLE,
  RUN_DETAIL_CREATE_HOME_CAPTURED_EVIDENCE_HEADING,
  RUN_DETAIL_CREATE_HOME_CAPTURED_EVIDENCE_HELPER,
} from "@/lib/runs/run-detail-create-home-evidence-copy";
import type { RunDetailCreateHomeCapturedEvidenceItem } from "@/lib/runs/run-detail-create-home-captured-evidence";

export type RunDetailCreateHomeCapturedEvidenceInventoryProps = {
  readonly items: readonly RunDetailCreateHomeCapturedEvidenceItem[];
};

function formatIngestedLabel(iso: string): string {
  const formatted = formatInstantForLocale(iso);

  return formatted.length > 0 ? formatted : iso;
}

export function RunDetailCreateHomeCapturedEvidenceInventory(
  props: RunDetailCreateHomeCapturedEvidenceInventoryProps,
): ReactElement {
  return (
    <section
      id="create-home-captured-evidence-inventory"
      className="scroll-mt-24"
      data-testid="run-detail-create-home-captured-evidence-inventory"
    >
      <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        {RUN_DETAIL_CREATE_HOME_CAPTURED_EVIDENCE_HEADING}
      </h3>
      <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {RUN_DETAIL_CREATE_HOME_CAPTURED_EVIDENCE_HELPER}
      </p>

      {props.items.length === 0 ? (
        <div className="mt-3">
          <EnterpriseCompactEmptyState
            title={RUN_DETAIL_CREATE_HOME_CAPTURED_EVIDENCE_EMPTY_TITLE}
            description={RUN_DETAIL_CREATE_HOME_CAPTURED_EVIDENCE_EMPTY_DESCRIPTION}
          />
        </div>
      ) : (
        <div className="mt-3">
          <EnterpriseTable ariaLabel="Uploaded capture inventory for this architecture run">
            <EnterpriseTableHead>
              <EnterpriseTableRow>
                <EnterpriseTableHeaderCell scope="col">File</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell scope="col">Uploaded</EnterpriseTableHeaderCell>
              </EnterpriseTableRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              {props.items.map((item) => (
                <EnterpriseTableRow key={item.key}>
                  <EnterpriseTableCell>{item.fileName}</EnterpriseTableCell>
                  <EnterpriseTableCell>{formatIngestedLabel(item.ingestedUtc)}</EnterpriseTableCell>
                </EnterpriseTableRow>
              ))}
            </EnterpriseTableBody>
          </EnterpriseTable>
        </div>
      )}
    </section>
  );
}
