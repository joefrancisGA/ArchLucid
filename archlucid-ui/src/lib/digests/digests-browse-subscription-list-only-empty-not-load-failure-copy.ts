/** No digest subscriptions in scope without a scoped review filter — not a failed catalog read. */
export const DIGESTS_BROWSE_SUBSCRIPTION_LIST_ONLY_EMPTY_NOT_LOAD_FAILURE_LINE =
  "No digest subscriptions exist in this workspace scope. That is not a failed digest catalog read and not the same as an empty scoped review history. Add subscriptions or pick a review scope before treating browse as down." as const;
