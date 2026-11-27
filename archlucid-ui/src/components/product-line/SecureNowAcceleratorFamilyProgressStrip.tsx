"use client";

import { useEffect, useState } from "react";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { computeSecureNowAcceleratorFamilyProgress } from "@/lib/product-line/securenow-accelerator-family-progress";
import { SECURENOW_ACCELERATOR_FIXTURE_PROGRESS_LINE } from "@/lib/product-line/securenow-accelerator-wave-b-honesty-copy";
import { readSecureNowVisitedAcceleratorHrefs } from "@/lib/product-line/securenow-resume-accelerator-open";

export function SecureNowAcceleratorFamilyProgressStrip(): React.JSX.Element {
  const scope = useOperatorScopeQueryKey();
  const [rows, setRows] = useState(() => computeSecureNowAcceleratorFamilyProgress(readSecureNowVisitedAcceleratorHrefs(scope)));

  useEffect(() => {
    setRows(computeSecureNowAcceleratorFamilyProgress(readSecureNowVisitedAcceleratorHrefs(scope)));
  }, [scope]);

  return (
    <div className="space-y-2" data-testid="securenow-accelerator-family-progress-strip">
      <p className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_ACCELERATOR_FIXTURE_PROGRESS_LINE}</p>
      <ul className="m-0 flex flex-wrap gap-3">
        {rows.map((row) => (
          <li key={row.family} className={OPERATOR_TYPOGRAPHY.body} data-testid={`securenow-accelerator-family-${row.family}`}>
            {row.family}: {row.visited}/{row.total}
          </li>
        ))}
      </ul>
    </div>
  );
}
