/** Buyer-facing confirm copy for Sign-in domains destructive actions (TB-1893). */

export const AUTH_DOMAINS_ENFORCEMENT_WARNING =
  "Requiring SSO may prevent users from signing in through other methods. Confirm that the configured identity provider and recovery access have been tested." as const;

export const AUTH_DOMAINS_ENABLE_ENFORCEMENT_CONFIRM_TITLE = "Enable SSO enforcement?" as const;

export const AUTH_DOMAINS_SET_ENFORCEMENT_CONFIRM_TITLE = "Change enforcement mode?" as const;

export const AUTH_DOMAINS_RECOVERY_REMOVE_CONFIRM_TITLE = "Remove recovery administrator?" as const;
