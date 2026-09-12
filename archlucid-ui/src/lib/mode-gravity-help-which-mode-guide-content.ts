/** MG-012 — help: which mode am I in. */
export const MODE_GRAVITY_HELP_WHICH_MODE_SLUG = "which-mode-am-i-in" as const;

export const MODE_GRAVITY_HELP_WHICH_MODE_TITLE = "Which mode am I in?" as const;

export const MODE_GRAVITY_HELP_WHICH_MODE_OVERVIEW =
  "Start with workspace mode: Working is your all-day instrument; Guided is eval teaching. On Working, Record means sealed-record proof and Practice means labeled dry-run. Demo and trial builds use eval chrome — they are not Working Record days." as const;

export const MODE_GRAVITY_HELP_WHICH_MODE_ALIASES = [
  "which mode",
  "am i in working",
  "guided or working",
  "career or rehearsal",
  "eval chrome",
  "demo mode",
] as const;

/** Customer chart excludes operator-experience engineering flag (ADR 0094). */
export const MODE_GRAVITY_HELP_WHICH_MODE_EXCLUDED_FROM_CHART = [
  "NEXT_PUBLIC_OPERATOR_EXPERIENCE",
  "operator-experience",
] as const;
