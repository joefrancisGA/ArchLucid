"use client";

import { useSyncExternalStore } from "react";

import {
  readOperatorScopeFromStorage,
  subscribeOperatorScopeStorageChanges,
  type OperatorScopeRecord,
} from "@/lib/operator/operator-scope-storage";

function getServerOperatorScopeRecordSnapshot(): OperatorScopeRecord | null {
  return null;
}

/** Live workspace/project switcher selection for client hubs (TB-2195 / TB-2387). */
export function useOperatorScopeRecord(): OperatorScopeRecord | null {
  return useSyncExternalStore(
    subscribeOperatorScopeStorageChanges,
    readOperatorScopeFromStorage,
    getServerOperatorScopeRecordSnapshot,
  );
}
