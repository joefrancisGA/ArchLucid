/** Optional in-app deep link for a Category-1 field (TB-2049 Digests golden / TB-2051). */
export type PageContextualHelpAction = {
  readonly label: string;
  readonly href: string;
};

/** The short answers one architect route offers in its contextual help popover. */
export type PageContextualHelpEntry = {
  readonly whatIsThisPage: string;
  readonly whatToDoNext: string;
  readonly whyEmpty?: string;
  readonly whereToConfigurePrerequisite?: string;
  readonly whatToDoNextAction?: PageContextualHelpAction;
  readonly whereToConfigureAction?: PageContextualHelpAction;
};

/**
 * One registry row. `prefix` matches a pathname exactly or as a path segment boundary, so
 * `/administration/users` does not answer for `/administration/users-and-roles`.
 */
export type PageContextualHelpRow = {
  readonly prefix: string;
  readonly entry: PageContextualHelpEntry;
};
