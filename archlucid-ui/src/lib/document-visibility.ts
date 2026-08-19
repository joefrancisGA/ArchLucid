"use client";

import { useSyncExternalStore } from "react";

export function isDocumentHidden(): boolean {
  return typeof document !== "undefined" && document.hidden;
}

function subscribeDocumentVisibility(onStoreChange: () => void): () => void {
  document.addEventListener("visibilitychange", onStoreChange);

  return () => {
    document.removeEventListener("visibilitychange", onStoreChange);
  };
}

function getDocumentHiddenSnapshot(): boolean {
  return isDocumentHidden();
}

function getDocumentHiddenServerSnapshot(): boolean {
  return false;
}

/** True when the browser tab is hidden (Page Visibility API). */
export function useDocumentHidden(): boolean {
  return useSyncExternalStore(
    subscribeDocumentVisibility,
    getDocumentHiddenSnapshot,
    getDocumentHiddenServerSnapshot,
  );
}
