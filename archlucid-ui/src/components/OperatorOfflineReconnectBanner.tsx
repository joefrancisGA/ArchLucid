"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { OPERATOR_CALLOUT_WARN_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  OPERATOR_OFFLINE_RECONNECT_BODY,
  OPERATOR_OFFLINE_RECONNECT_RETRY_LABEL,
  OPERATOR_OFFLINE_RECONNECT_TITLE,
  readNavigatorOnline,
  retryOperatorOfflineConnection,
  shouldShowOperatorOfflineReconnectBanner,
} from "@/lib/operator-offline-reconnect";
import { cn } from "@/lib/utils";

/**
 * Operator-shell strip when the browser reports offline (TB-2214).
 * Retry invalidates TanStack Query caches when the shell query client is present.
 */
export function OperatorOfflineReconnectBanner(): React.JSX.Element | null {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(readNavigatorOnline());

    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const onRetry = useCallback(() => {
    void retryOperatorOfflineConnection(queryClient);
  }, [queryClient]);

  if (!shouldShowOperatorOfflineReconnectBanner(isOnline)) {
    return null;
  }

  return (
    <div
      className={cn(OPERATOR_CALLOUT_WARN_CLASS, "mb-3 flex flex-wrap items-center justify-between gap-3 shadow-sm")}
      role="alert"
      data-testid="operator-offline-reconnect"
    >
      <div className="min-w-0 flex-1">
        <p className={cn("m-0 font-semibold text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)}>
          {OPERATOR_OFFLINE_RECONNECT_TITLE}
        </p>
        <p className={cn("m-0 mt-1 leading-snug text-amber-950 dark:text-amber-50", OPERATOR_TYPOGRAPHY.helper)}>
          {OPERATOR_OFFLINE_RECONNECT_BODY}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        data-testid="operator-offline-reconnect-retry"
        onClick={onRetry}
      >
        {OPERATOR_OFFLINE_RECONNECT_RETRY_LABEL}
      </Button>
    </div>
  );
}