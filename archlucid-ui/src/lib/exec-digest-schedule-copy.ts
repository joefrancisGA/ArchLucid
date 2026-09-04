/** Hub relationship copy — accurate to separate sponsor vs architecture digest pipelines. */
export const EXEC_DIGEST_PRODUCT_INTRO =
  "An sponsor digest is a weekly rollup of architecture and review activity for sponsor recipients you configure here. Architecture digests generated from advisory scans are delivered separately to destinations on the Subscriptions tab." as const;

export const EXEC_DIGEST_DIRECT_RECIPIENTS_HELPER =
  "Direct recipients receive this sponsor digest email. They do not need to be workspace users. Enter one address per line, or separate addresses with commas or semicolons. Duplicate addresses are rejected before save." as const;

export const EXEC_DIGEST_SUBSCRIPTIONS_HELPER =
  "Subscription destinations receive architecture digests after advisory scans run. They use a different schedule and content than the sponsor digest on this page." as const;

export const EXEC_DIGEST_PREVIEW_HELPER =
  "Preview opens the latest architecture digest in Browse. It is not an sponsor-digest compose preview and does not use unsaved schedule changes." as const;

export const EXEC_DIGEST_PREVIEW_UNAVAILABLE =
  "A preview will be available after the first architecture digest is generated." as const;

export const EXEC_DIGEST_TEST_GENERATION_HELPER =
  "This opens advisory scan schedules so you can generate an architecture digest for subscription destinations. It may consume AI budget, does not email sponsor recipients on this page, and does not change the sponsor schedule saved here." as const;

export const EXEC_DIGEST_SAMPLE_BLOCKED =
  "Scheduling is unavailable in the sample workspace. Start an evaluation or sign in to configure sponsor digest delivery for your organization." as const;

export const EXEC_DIGEST_READ_ONLY =
  "You can review the sponsor digest schedule. Changing recipients, cadence, or delivery requires a role that can manage digests." as const;

export const DIGESTS_SCHEDULE_TAB_RESPONSIBILITY =
  "Sponsor sponsor rollup email — separate from advisory scan cadence (Advisory schedules)." as const;

export const DIGESTS_BROWSE_TAB_RESPONSIBILITY =
  "Read generated architecture digest history." as const;

export const DIGESTS_BROWSE_TAB_GET_STARTED_RESPONSIBILITY =
  "Complete setup steps before digest history appears on this tab." as const;

export const DIGESTS_SUBSCRIPTIONS_TAB_RESPONSIBILITY =
  "Manage who receives architecture digest delivery." as const;
