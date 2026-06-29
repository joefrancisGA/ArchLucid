import { redirect } from "next/navigation";

import { SETTINGS_ROLES_USERS_TAB_PATH } from "@/lib/invite-reviewer-flow";

/** Dedicated invite-reviewer entry — lands on the users tab invite form. */
export default function InviteReviewerPage() {
  redirect(SETTINGS_ROLES_USERS_TAB_PATH);
}
