"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  getOperatorScopeQueryKeyServerSnapshot,
  getOperatorScopeQueryKeySnapshot,
  parseOperatorScopeQueryKey,
  subscribeOperatorScopeQueryKey,
  type OperatorScopeQueryKey,
} from "@/lib/operator/operator-scope-query-key";

export function useOperatorScopeQueryKey(): OperatorScopeQueryKey {
  const serializedScope = useSyncExternalStore(
    subscribeOperatorScopeQueryKey,
    getOperatorScopeQueryKeySnapshot,
    getOperatorScopeQueryKeyServerSnapshot,
  );

  return useMemo(() => parseOperatorScopeQueryKey(serializedScope), [serializedScope]);
}
