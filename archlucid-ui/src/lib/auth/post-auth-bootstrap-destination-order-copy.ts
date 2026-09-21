/** LS-004 — customer-facing post-auth destination order (invite → workspace → create → access). */

export const POST_AUTH_BOOTSTRAP_DESTINATION_ORDER_SUMMARY =
  "After sign-in: accept a pending invitation, open an existing workspace, create a workspace when you have no membership, or request access." as const;

export const POST_AUTH_BOOTSTRAP_INVITATION_JOINED_BODY =
  "You joined your organization’s workspace. Reviews here use your tenant data — not the Customer Intake Demo sample." as const;
