import { cn } from "@/lib/utils";
import {
  AUTH_BOOTSTRAP_LOADING_DETAIL,
  AUTH_BOOTSTRAP_PAGE_TITLE,
} from "@/lib/auth/auth-bootstrap-page-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Shared loading chrome for `/auth/bootstrap` Suspense fallback and status fetch. */
export function PostAuthBootstrapLoadingView(): React.JSX.Element {
  return (
    <div className="max-w-[560px]" data-testid="post-auth-bootstrap-loading">
      <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{AUTH_BOOTSTRAP_PAGE_TITLE}</h1>

      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className={cn("mt-3", OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}
        data-testid="post-auth-bootstrap-loading-status"
      >
        <p className="m-0">{AUTH_BOOTSTRAP_LOADING_DETAIL}</p>
      </div>
    </div>
  );
}
