"use client";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { resolveInviteeOrientationContext } from "@/lib/invitee-first-orientation";

export function useInviteeReviewerContext() {
  const { currentPrincipal } = useOperatorNavAuthority();

  return resolveInviteeOrientationContext(currentPrincipal);
}
