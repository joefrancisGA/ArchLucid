"use client";

import { useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ArchitectureDecisionRegisterEntry } from "@/lib/api/governance-stickiness-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  triggerDecisionRegisterCsvDownload,
  triggerDecisionRegisterJsonDownload,
} from "@/lib/governance/decision-register-export";
import { cn } from "@/lib/utils";

export type DecisionRegisterExportButtonProps = {
  readonly decisions: readonly ArchitectureDecisionRegisterEntry[];
  readonly disabled?: boolean;
};

export function DecisionRegisterExportButton(props: DecisionRegisterExportButtonProps): React.JSX.Element {
  const { decisions, disabled = false } = props;
  const [menuKey, setMenuKey] = useState(0);
  const exportDisabled = disabled || decisions.length === 0;
  const exportHint = useMemo(() => {
    if (decisions.length === 0) {
      return "No decisions to export for the current filters.";
    }

    return "Exports include confidenceSource and buyerConfidenceSource disposition honesty.";
  }, [decisions.length]);

  return (
    <div className="flex max-w-xs flex-col gap-1" data-testid="decision-register-export-menu">
      <Select
        key={menuKey}
        disabled={exportDisabled}
        onValueChange={(value: string) => {
          if (value === "json") {
            triggerDecisionRegisterJsonDownload(decisions);
          }

          if (value === "csv") {
            triggerDecisionRegisterCsvDownload(decisions);
          }

          setMenuKey((current) => current + 1);
        }}
      >
        <SelectTrigger
          className="h-9 w-[14rem]"
          aria-label="Export decision register"
          data-testid="decision-register-export-trigger"
        >
          <SelectValue placeholder="Export register" />
        </SelectTrigger>
        <SelectContent className="min-w-[16rem]">
          <SelectItem value="csv">Download CSV</SelectItem>
          <SelectItem value="json">Download JSON</SelectItem>
        </SelectContent>
      </Select>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{exportHint}</p>
    </div>
  );
}
