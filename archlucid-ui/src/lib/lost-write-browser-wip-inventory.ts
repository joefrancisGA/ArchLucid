export type LostWriteBrowserWipStorageKind = "sessionStorage" | "localStorage";

export type LostWriteBrowserWipKeyRow = {
  readonly id: string;
  readonly key: string;
  readonly storage: LostWriteBrowserWipStorageKind;
  readonly survivesTabClose: boolean;
  readonly crossDevice: boolean;
  readonly owningPrompt: string;
  readonly notes: string;
};

/**
 * Browser keys that hold in-flight livelihood work (LW-005). Cosmetic prefs (favorites, recents, nav pins)
 * are out of this wave and must not be listed as server-synced user preferences.
 */
export const LOST_WRITE_BROWSER_WIP_KEYS: readonly LostWriteBrowserWipKeyRow[] = [
  {
    id: "pending-mutation-v1",
    key: "archlucid.session.livelihoodPendingMutation_v1",
    storage: "sessionStorage",
    survivesTabClose: false,
    crossDevice: false,
    owningPrompt: "LW-051",
    notes: "LP-19 two kinds. Tab close drops the POST. Not a server user-preference row.",
  },
  {
    id: "offline-draft-queue-v1",
    key: "archlucid.architecture-draft-offline-queue.v1",
    storage: "localStorage",
    survivesTabClose: true,
    crossDevice: false,
    owningPrompt: "LW-036",
    notes: "v1 entries stringify field payload only — no expectedUpdatedUtc. Migrate without omit-token PATCH.",
  },
  {
    id: "offline-draft-queue-v2",
    key: "archlucid.architecture-draft-offline-queue.v2",
    storage: "localStorage",
    survivesTabClose: true,
    crossDevice: false,
    owningPrompt: "LW-036",
    notes: "v2 entry carries expectedUpdatedUtc. Not server preferences.",
  },
  {
    id: "idle-desk-restore",
    key: "archlucid.session.idleDeskRestore_v1",
    storage: "localStorage",
    survivesTabClose: true,
    crossDevice: false,
    owningPrompt: "LW-073",
    notes: "Idle snapshot bag for dirty livelihood forms. Not favorites/recents.",
  },
  {
    id: "wizard-session",
    key: "archlucid:wizard-session:v1:*",
    storage: "sessionStorage",
    survivesTabClose: false,
    crossDevice: false,
    owningPrompt: "LW-075",
    notes: "Guided intake / SSO wizard session snapshots. Tab-scoped.",
  },
] as const;
