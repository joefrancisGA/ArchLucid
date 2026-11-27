"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { readSecureNowRecentAcceleratorOpens } from "@/lib/product-line/securenow-resume-accelerator-open";

export function SecureNowAcceleratorRecentOpensStrip(): React.JSX.Element | null {
  const scope = useOperatorScopeQueryKey();
  const [recent, setRecent] = useState(() => readSecureNowRecentAcceleratorOpens(scope));

  useEffect(() => {
    setRecent(readSecureNowRecentAcceleratorOpens(scope));
  }, [scope]);

  if (recent.length === 0) {
    return null;
  }

  return (
    <div className="rounded border border-border p-3" data-testid="securenow-accelerator-recent-opens-strip">
      <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>Recently opened</h3>
      <ul className="m-0 list-disc pl-5">
        {recent.map((row) => (
          <li key={row.href} className={OPERATOR_TYPOGRAPHY.body}>
            <Link href={row.href} className={OPERATOR_LINK.inline} data-testid={`securenow-accelerator-recent-${row.href}`}>
              {row.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
