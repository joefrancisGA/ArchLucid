"use client";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { Button } from "@/components/ui/button";
import {
  clearSecureNowPinnedPathId,
  readSecureNowPinnedPathId,
  type SecureNowStickinessScope,
  writeSecureNowPinnedPathId,
} from "@/lib/product-line/securenow-stickiness";
import { useState } from "react";

type SecureNowPinPathButtonProps = {
  readonly pathId: string;
};

/** One watched path per tenant workspace. Browser storage only until server sync ships. Not a usage score. */
export function SecureNowPinPathButton(props: SecureNowPinPathButtonProps): React.JSX.Element | null {
  const pathId = props.pathId.trim();
  const { tenantId, workspaceId } = useOperatorScopeQueryKey();

  if (pathId.length === 0) {
    return null;
  }

  return (
    <WorkspacePinPathButton
      key={JSON.stringify([tenantId, workspaceId])}
      pathId={pathId}
      scope={{ tenantId, workspaceId }}
    />
  );
}

function WorkspacePinPathButton({ pathId, scope }: {
  readonly pathId: string;
  readonly scope: SecureNowStickinessScope;
}): React.JSX.Element {
  const [pinnedPathId, setPinnedPathId] = useState(() => readSecureNowPinnedPathId(scope));
  const isPinned = pinnedPathId === pathId;

  function togglePin(): void {
    const saved = isPinned
      ? clearSecureNowPinnedPathId(scope)
      : writeSecureNowPinnedPathId(scope, pathId);
    if (saved) {
      setPinnedPathId(isPinned ? null : pathId);
    }
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
