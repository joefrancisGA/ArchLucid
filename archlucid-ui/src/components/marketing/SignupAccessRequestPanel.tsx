import Link from "next/link";

import { Button } from "@/components/ui/button";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Shown when public self-service signup is disabled (invite-only posture). */
export function SignupAccessRequestPanel() {
  return (
    <div
      className={cn(
        "rounded-lg border border-al-border-subtle bg-al-surface-raised p-6 text-center",
        MARKETING_SURFACES.card,
      )}
    >
      <p className={cn("text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
        ArchLucid evaluation access is by invitation during private beta. Request access and we will
        send you an invitation when a seat is available.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild variant="default">
          <Link href="/get-started">Request access</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/auth/signin">Sign in</Link>
        </Button>
      </div>
    </div>
  );
}
