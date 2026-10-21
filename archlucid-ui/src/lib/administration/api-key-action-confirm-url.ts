import type { ApiKeyPendingAction } from "@/lib/api-keys-settings-types";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const API_KEY_ACTION_PARAM = "apiKeyAction";

export const API_KEY_ACTION_OPTIONS = ["rotate_admin", "rotate_readonly", "issue_overlap"] as const;

export type ApiKeyActionConfirmKind = (typeof API_KEY_ACTION_OPTIONS)[number];

const API_KEY_ACTION_IDS = new Set<string>(API_KEY_ACTION_OPTIONS);

export function parseApiKeyActionFromSearch(raw: string | null | undefined): ApiKeyActionConfirmKind | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!API_KEY_ACTION_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as ApiKeyActionConfirmKind;
}

export function apiKeyActionToPendingAction(kind: ApiKeyActionConfirmKind): ApiKeyPendingAction {
  return { kind };
}

export function pendingActionToApiKeyAction(action: ApiKeyPendingAction): ApiKeyActionConfirmKind {
  return action.kind;
}

export function apiKeyActionConfirmHrefFromSearch(
  currentSearch: string,
  action: ApiKeyActionConfirmKind | null,
  pathname: string = "/administration/api-keys",
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (action === null) {
      params.delete(API_KEY_ACTION_PARAM);
    } else {
      params.set(API_KEY_ACTION_PARAM, action);
    }
    },
  });
}
