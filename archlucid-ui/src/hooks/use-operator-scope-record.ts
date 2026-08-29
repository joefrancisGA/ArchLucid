"use client";

import { useSyncExternalStore } from "react";

import {
  getOperatorScopeRecordServerSnapshot,
  getOperatorScopeRecordSnapshot,
  subscribeOperatorScopeRecord,
  type OperatorScopeRecord,
} from "@/lib/operator/operator-scope-storage";

/** Live workspace/project switcher selection for client hubs (TB-2195 / TB-2387). */
export function useOperatorScopeRecord(): OperatorScopeRecord | null {
  return useSyncExternalStore(
    subscribeOperatorScopeRecord,
    getOperatorScopeRecordSnapshot,
    getOperatorScopeRecordServerSnapshot,
  );
}
