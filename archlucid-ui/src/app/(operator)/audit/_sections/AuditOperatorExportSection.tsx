import { cn } from "@/lib/utils";
import {
  auditExportControlDisabledTitle,
  auditExportCsvButtonLabelRoleRestricted,
  auditExportCsvButtonLabelWindowIncomplete,
  auditExportSectionSupportingLine,
} from "@/lib/enterprise-controls-context-copy";

type AuditOperatorExportSectionProps = {
  csvExportUiAllowed: boolean;
  exporting: boolean;
  searching: boolean;
  exportDateRangeReady: boolean;
  exportRoleOk: boolean;
  onExportCsv: () => void | Promise<void>;
};

export function AuditOperatorExportSection(props: AuditOperatorExportSectionProps) {
  const {
    csvExportUiAllowed,
    exporting,
    searching,
    exportDateRangeReady,
    exportRoleOk,
    onExportCsv,
  } = props;

  return (
    <section
      aria-labelledby="audit-export-heading"
      className={cn(
        "border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 mt-5 bg-neutral-50 dark:bg-neutral-950",
        !csvExportUiAllowed && "opacity-90",
      )}
    >
      <h3 id="audit-export-heading" className="mt-0 mb-2 text-base">
        {csvExportUiAllowed ? "Export" : "Export (restricted)"}
      </h3>
      <p className="text-neutral-500 dark:text-neutral-400 text-xs max-w-xl mt-0 mb-3">
        {auditExportSectionSupportingLine}
      </p>
      <button
        type="button"
        onClick={() => void onExportCsv()}
        disabled={!csvExportUiAllowed || exporting || searching}
        title={
          !exportDateRangeReady
            ? "Set From and To to enable export"
            : !exportRoleOk
              ? auditExportControlDisabledTitle
              : "Export to CSV using the current filters"
        }
      >
        {exporting
          ? "Exporting…"
          : csvExportUiAllowed
            ? "Export to CSV"
            : !exportDateRangeReady
              ? auditExportCsvButtonLabelWindowIncomplete
              : !exportRoleOk
                ? auditExportCsvButtonLabelRoleRestricted
                : "Export to CSV"}
      </button>
    </section>
  );
}
