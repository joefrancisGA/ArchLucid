import type { SecurityDeclaredConnectionRelationshipType } from "@/lib/security-declared-connection-types";

export type DeclaredConnectionFormDraft = {
  readonly fromCloudResourceId: string;
  readonly toCloudResourceId: string;
  readonly relationshipType: SecurityDeclaredConnectionRelationshipType;
  readonly rationale: string;
  readonly evidenceReference: string;
  readonly expirationUtc: string;
  readonly approvedByActorKey: string;
};

export function declaredConnectionsDraftStorageKey(productLine: string, routePath: string): string {
  return `archlucid.declared-connections.draft.${productLine}.${routePath}`;
}

export function readDeclaredConnectionFormDraft(key: string): DeclaredConnectionFormDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(key);

  if (raw == null || raw.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(raw) as DeclaredConnectionFormDraft;
  } catch {
    return null;
  }
}

export function writeDeclaredConnectionFormDraft(key: string, draft: DeclaredConnectionFormDraft): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(key, JSON.stringify(draft));
}

export function clearDeclaredConnectionFormDraft(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(key);
}
