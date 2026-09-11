export type LostWriteHelpCopyHonesty = "conflict-aware" | "save-always" | "presence-risk";

export type LostWriteHelpCopyRow = {
  readonly id: string;
  readonly sourceRoots: readonly string[];
  readonly excerpt: string;
  readonly honesty: LostWriteHelpCopyHonesty;
  readonly followUpPrompt: string;
};

/**
 * In-app copy that talks about draft save / overwrite (LW-012). Do not add live-presence language.
 * Rewrite save-always rows in LW-034 / LW-094.
 */
export const LOST_WRITE_HELP_OVERWRITE_COPY: readonly LostWriteHelpCopyRow[] = [
  {
    id: "draft-conflict-another-session",
    sourceRoots: ["components/architecture/ArchitectureDraftWorkspaceIntakeStack.tsx"],
    excerpt: "This architecture draft changed in another browser session or from offline replay.",
    honesty: "conflict-aware",
    followUpPrompt: "LW-034",
  },
  {
    id: "draft-conflict-keep-mine",
    sourceRoots: ["components/architecture/ArchitectureDraftWorkspaceIntakeStack.tsx"],
    excerpt: "Keep mine",
    honesty: "conflict-aware",
    followUpPrompt: "LW-034",
  },
  {
    id: "persist-conflict-another-session",
    sourceRoots: ["hooks/use-architecture-draft-autosave-persist.ts"],
    excerpt: "This architecture was updated in another session or from offline replay.",
    honesty: "conflict-aware",
    followUpPrompt: "LW-034",
  },
  {
    id: "keyboard-save-draft",
    sourceRoots: ["docs/KEYBOARD_SHORTCUTS.md"],
    excerpt:
      "Save architecture draft from the review workbench when the draft editor is open — may return a conflict if another session saved first",
    honesty: "conflict-aware",
    followUpPrompt: "LW-094",
  },
] as const;
