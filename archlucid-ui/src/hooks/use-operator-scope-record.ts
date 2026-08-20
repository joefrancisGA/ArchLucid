"use client";

import { useSyncExternalStore } from "react";

import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  readOperatorScopeFromStorage,
  type OperatorScopeRecord,
} from "@/lib/operator/operator-scope-storage";

function subscribeOperatorScopeRecord(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, onStoreChange);
  };
}

function getServerOperatorScopeRecordSnapshot(): OperatorScopeRecord | null {
  return null;
}

/** Live workspace/project switcher selection for client hubs (TB-2195 / TB-2387). */
export function useOperatorScopeRecord(): OperatorScopeRecord | null {
  return useSyncExternalStore(
    subscribeOperatorScopeRecord,
    readOperatorScopeFromStorage,
    getServerOperatorScopeRecordSnapshot,
  );
}
