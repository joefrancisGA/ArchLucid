/** Optional in-app deep link for a Category-1 field (TB-2049 Digests golden / TB-2051). */
export type PageContextualHelpAction = {
  readonly label: string;
  readonly href: string;
};

/** The short answers one architect route offers in its contextual help drawer. */
export type PageContextualHelpEntry = {
  readonly whatIsThisPage: string;
  readonly whatToDoNext: string;
  readonly whyEmpty?: string;
  readonly whereToConfigurePrerequisite?: string;
  readonly whatToDoNextAction?: PageContextualHelpAction;
  readonly whereToConfigureAction?: PageContextualHelpAction;
  /** Numbered task steps for the page-help drawer. Keep each step to one sentence. */
  readonly taskSteps?: readonly string[];
};

/**
 * One registry row. `prefix` matches a pathname exactly or as a path segment boundary, so
 * `/administration/users` does not answer for `/administration/users-and-roles`.
 */
export type PageContextualHelpRow = {
  readonly prefix: string;
  readonly entry: PageContextualHelpEntry;
};

/** Default drawer steps for `/help/*` mirror rows that orient architects to live settings hubs. */
export const HELP_TOPIC_MIRROR_TASK_STEPS = [
  "Open the live destination from the primary CTA.",
  "Use Sources when this orientation must be cited.",
  "Return to the hub when live configuration is required.",
] as const satisfies readonly string[];
