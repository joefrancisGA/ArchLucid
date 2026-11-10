"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ArchLucidOpenGateReturnRecord } from "@/lib/architecture/archlucid-open-gate-return-storage";
import { readArchLucidOpenGateReturnRecord } from "@/lib/architecture/archlucid-open-gate-return-storage";
import {
  OPERATOR_HOME_WORKING_OPEN_GATE_BROWSER_LOCAL,
  OPERATOR_HOME_WORKING_OPEN_GATE_PREFIX,
} from "@/lib/operator/operator-home-working-open-gate-copy";
import { cn } from "@/lib/utils";

export type OperatorHomeWorkingOpenGateLineProps = {
  readonly workingMode: boolean;
};

/** Working Home — one open-gate sentence from the last review spine visit (browser-local). */
export function OperatorHomeWorkingOpenGateLine(
  props: OperatorHomeWorkingOpenGateLineProps,
): React.JSX.Element | null {
  const { productLine } = useProductLine();
  const scope = useOperatorScopeQueryKey();
  const [ready, setReady] = useState(false);
  const [record, setRecord] = useState<ArchLucidOpenGateReturnRecord | null>(null);

  useEffect(() => {
    setReady(true);
    setRecord(readArchLucidOpenGateReturnRecord(scope.workspaceId));
  }, [scope.workspaceId]);

  if (!props.workingMode || productLine !== "architecture" || !ready || record === null) {
    return null;
  }

  const trimmedLabel = record.openGateLabel.trim();

  if (trimmedLabel.length === 0) {
    return null;
  }

  return (
    <p
      className={cn("m-0 rounded-md border border-dashed border-neutral-300 bg-neutral-50/60 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="operator-home-working-open-gate"
    >
      {OPERATOR_HOME_WORKING_OPEN_GATE_PREFIX}{" "}
      <Link className={OPERATOR_LINK.inline} href={record.href} data-testid="operator-home-working-open-gate-link">
        {trimmedLabel}
      </Link>
      . {OPERATOR_HOME_WORKING_OPEN_GATE_BROWSER_LOCAL}
    </p>
  );
}
