"use client";

import { usePathname } from "next/navigation";

import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { shouldDeferOperatorShellChrome } from "@/lib/operator-shell-access-gate";

/** True while operator shell chrome (sidebar/top bar) must stay hidden pending authority or home access. */
export function useOperatorShellChromeDeferred(): boolean {
  const pathname = usePathname();
  const { isAuthorityLoading } = useOperatorNavAuthority();

  return shouldDeferOperatorShellChrome(pathname, isAuthorityLoading);
}
