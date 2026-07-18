import type { ReactNode } from "react";

/**
 * Shared responsive shell for marketing/operator auth steps (sign-in, callback, bootstrap).
 * Keeps touch targets and side padding usable on narrow phones without changing step internals.
 */
export function AuthFlowShell({ children }: { readonly children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[560px] px-4 py-4 sm:px-6 sm:py-6">{children}</div>
  );
}
