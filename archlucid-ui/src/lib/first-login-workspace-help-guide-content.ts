/** LS-015 — help: your workspace after sign-in. */
export const FIRST_LOGIN_WORKSPACE_HELP_SLUG = "first-login-workspace" as const;

export const FIRST_LOGIN_WORKSPACE_HELP_TITLE = "Your workspace after sign-in" as const;

export const FIRST_LOGIN_WORKSPACE_HELP_OVERVIEW =
  "After sign-in, ArchLucid opens your live tenant workspace by default. Training is an optional walkthrough on sample data — it is not the same control as Record or Practice." as const;

export const FIRST_LOGIN_WORKSPACE_HELP_INVITE_SECTION =
  "If an admin invited you, you join the workspace they assigned. You land on that live workspace — not the Customer Intake Demo sample — unless you explicitly choose Training on first login." as const;

export const FIRST_LOGIN_WORKSPACE_HELP_CREATE_SECTION =
  "If you have no workspace membership yet, post-auth setup helps you create or request access. Training does not replace that step." as const;

export const FIRST_LOGIN_WORKSPACE_HELP_FIRST_CHOICE_SECTION =
  "On your first signed-in session, you may see two choices: Start in my workspace (your tenant scope) or Training (Guided mode on the sample workspace). Either choice is saved so you are not asked again." as const;

export const FIRST_LOGIN_WORKSPACE_HELP_RECORD_VS_TRAINING_SECTION =
  "Record and Practice are review-type controls on your live workspace. Training is workspace scope on sample data. Selecting Record while you are still on the sample workspace does not make the data live — check the workspace label and honesty banners." as const;

export const FIRST_LOGIN_WORKSPACE_HELP_NOT_LIVE_SECTION =
  "If you see NOT LIVE DATA or Customer Intake Demo in the header, you are on the sample workspace. Use Back to your workspace in the banner or scope switcher, or finish Training and leave when you are ready." as const;

export const FIRST_LOGIN_WORKSPACE_HELP_SEARCH_ALIASES = [
  "training mode",
  "not live data",
  "customer intake demo",
  "first login",
  "live data",
  "sample workspace",
  "leave training",
] as const;
