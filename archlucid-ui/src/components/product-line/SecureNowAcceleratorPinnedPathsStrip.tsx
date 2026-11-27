"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  isSecureNowAcceleratorPathPinned,
  pinSecureNowAcceleratorPath,
  readSecureNowPinnedAcceleratorPaths,
  SECURENOW_PINNABLE_ACCELERATOR_PATHS,
  SECURENOW_PINNED_ACCELERATOR_PATHS_LEAD,
  type SecureNowPinnedAcceleratorPath,
  unpinSecureNowAcceleratorPath,
} from "@/lib/product-line/securenow-pinned-accelerator-paths";
import { cn } from "@/lib/utils";

export function SecureNowAcceleratorPinnedPathsStrip(): React.JSX.Element {
  const scope = useOperatorScopeQueryKey();
  const [pinned, setPinned] = useState<readonly SecureNowPinnedAcceleratorPath[]>([]);

  const refresh = useCallback((): void => {
    setPinned(readSecureNowPinnedAcceleratorPaths(scope));
  }, [scope]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const togglePin = (row: SecureNowPinnedAcceleratorPath): void => {
    if (isSecureNowAcceleratorPathPinned(scope, row.href)) {
      unpinSecureNowAcceleratorPath(scope, row.href);
    } else {
      pinSecureNowAcceleratorPath(scope, row);
    }

    refresh();
  };

  return (
    <section
      className="space-y-2 rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800"
      data-testid="securenow-accelerator-pinned-paths-strip"
      aria-label="Pinned accelerator paths"
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{SECURENOW_PINNED_ACCELERATOR_PATHS_LEAD}</p>
      {pinned.length > 0 ? (
        <ul className="m-0 flex flex-wrap gap-3 p-0 list-none">
          {pinned.map((row) => (
            <li key={row.href}>
              <Link
                href={row.href}
                className={cn(OPERATOR_LINK.nav, "font-medium")}
                data-testid={`securenow-pinned-path-link-${row.href}`}
              >
                {row.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="securenow-pinned-paths-empty">
          No pinned accelerators on this device yet.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {SECURENOW_PINNABLE_ACCELERATOR_PATHS.map((row) => {
          const pinnedNow = isSecureNowAcceleratorPathPinned(scope, row.href);

          return (
            <Button
              key={row.href}
              type="button"
              size="sm"
              variant={pinnedNow ? "secondary" : "outline"}
              data-testid={`securenow-pin-toggle-${row.href}`}
              onClick={() => togglePin(row)}
            >
              {pinnedNow ? `Unpin ${row.label}` : `Pin ${row.label}`}
            </Button>
          );
        })}
      </div>
    </section>
  );
}
