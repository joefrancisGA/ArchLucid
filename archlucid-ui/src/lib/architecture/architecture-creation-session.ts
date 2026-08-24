import { architectureDraftPath } from "@/lib/architecture/architecture-routes";

const ARCHITECTURE_CREATION_DRAFT_ID_STORAGE_KEY = "archlucid.architecture-creation.draft-id";

export function readArchitectureCreationDraftId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = sessionStorage.getItem(ARCHITECTURE_CREATION_DRAFT_ID_STORAGE_KEY)?.trim() ?? "";

  return value.length > 0 ? value : null;
}

export function writeArchitectureCreationDraftId(draftId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(ARCHITECTURE_CREATION_DRAFT_ID_STORAGE_KEY, draftId);
}

export function clearArchitectureCreationDraftId(): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(ARCHITECTURE_CREATION_DRAFT_ID_STORAGE_KEY);
}

/** Updates the address bar after deferred create without remounting the create page. */
export function replaceArchitectureCreationUrlWithoutNavigation(draftId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.history.replaceState(window.history.state, "", architectureDraftPath(draftId));
}
