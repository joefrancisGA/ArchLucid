"use client";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { Button } from "@/components/ui/button";
import {
  clearSecureNowPinnedPathId,
  readSecureNowPinnedPathId,
  writeSecureNowPinnedPathId,
} from "@/lib/product-line/securenow-stickiness";
import { useState } from "react";

type SecureNowPinPathButtonProps = {
  readonly pathId: string;
};

/** One watched path per workspace. Browser storage only. Not a usage score. */
export function SecureNowPinPathButton(props: SecureNowPinPathButtonProps): React.JSX.Element | null {
  const pathId = props.pathId.trim();
  const scope = useOperatorScopeQueryKey();
  const [pinnedPathId, setPinnedPathId] = useState<string | null>(() =>
    readSecureNowPinnedPathId(scope.workspaceId),
  );

  if (pathId.length === 0) {
    return null;
  }

  const isPinned = pinnedPathId === pathId;

  function togglePin(): void {
    if (isPinned) {
      clearSecureNowPinnedPathId(scope.workspaceId);
      setPinnedPathId(null);

      return;
    }

    writeSecureNowPinnedPathId(scope.workspaceId, pathId);
    setPinnedPathId(pathId);
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      data-testid="securenow-pin-path"
      onClick={togglePin}
    >
      {isPinned ? "Stop watching this path" : "Watch this path"}
    </Button>
  );
}
