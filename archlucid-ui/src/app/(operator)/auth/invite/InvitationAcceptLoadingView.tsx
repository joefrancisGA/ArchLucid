import { cn } from "@/lib/utils";
import {
  AUTH_INVITE_LOADING_DETAIL,
  AUTH_INVITE_PAGE_TITLE,
} from "@/lib/auth/auth-invite-page-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Shared loading chrome for `/auth/invite` Suspense fallback and token validation. */
export function InvitationAcceptLoadingView(): React.JSX.Element {
  return (
    <div className="max-w-[560px]" data-testid="invitation-accept-loading">
      <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{AUTH_INVITE_PAGE_TITLE}</h1>

      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className={cn("mt-3", OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}
        data-testid="invitation-accept-loading-status"
      >
        <p className="m-0">{AUTH_INVITE_LOADING_DETAIL}</p>
      </div>
    </div>
  );
}
