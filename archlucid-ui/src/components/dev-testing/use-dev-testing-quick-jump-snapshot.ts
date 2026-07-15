import { useEffect, useMemo, useState } from "react";

import { isDevTestingOverridesEnabled } from "@/lib/dev-testing-overrides";
import {
  buildEmptyDevTestingQuickJumpSnapshot,
  loadDevTestingQuickJumpSnapshot,
  type DevTestingQuickJumpSnapshot,
} from "@/lib/load-dev-testing-quick-jump-snapshot";

function normalizeRunIds(runIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const raw of runIds) {
    const trimmed = raw.trim();

    if (trimmed.length === 0 || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
}

export function useDevTestingQuickJumpSnapshot(runIds: readonly string[]): {
  readonly snapshot: DevTestingQuickJumpSnapshot;
  readonly loading: boolean;
} {
  const normalizedRunIds = useMemo(() => normalizeRunIds(runIds), [runIds]);
  const runIdsKey = useMemo(() => normalizedRunIds.join("|"), [normalizedRunIds]);
  const [snapshot, setSnapshot] = useState<DevTestingQuickJumpSnapshot>(() =>
    buildEmptyDevTestingQuickJumpSnapshot(normalizedRunIds),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isDevTestingOverridesEnabled()) {
      setSnapshot(buildEmptyDevTestingQuickJumpSnapshot(normalizedRunIds));
      setLoading(false);

      return;
    }

    let cancelled = false;

    setLoading(true);

    void loadDevTestingQuickJumpSnapshot(normalizedRunIds)
      .then((loaded) => {
        if (!cancelled) {
          setSnapshot(loaded);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSnapshot(buildEmptyDevTestingQuickJumpSnapshot(normalizedRunIds));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [normalizedRunIds, runIdsKey]);

  return { snapshot, loading };
}
