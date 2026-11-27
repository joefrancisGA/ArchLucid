"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  readSecureNowPinnedPathId,
  secureNowPathInspectHref,
} from "@/lib/product-line/securenow-stickiness";

export function SecureNowAcceleratorPinnedQuickStrip(): React.JSX.Element | null {
  const scope = useOperatorScopeQueryKey();
  const [pinnedPathId, setPinnedPathId] = useState<string | null>(null);

  useEffect(() => {
    const pathId = readSecureNowPinnedPathId(scope);
    setPinnedPathId(pathId);
  }, [scope]);

  if (pinnedPathId === null || pinnedPathId.trim().length === 0) {
    return null;
  }

  return (
    <p className={OPERATOR_TYPOGRAPHY.body} data-testid="securenow-accelerator-pinned-quick-strip">
      Pinned path:{" "}
      <Link href={secureNowPathInspectHref(pinnedPathId)} className={OPERATOR_LINK.inline}>
        {pinnedPathId}
      </Link>
    </p>
  );
}
