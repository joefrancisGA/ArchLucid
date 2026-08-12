"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { shouldDeferOperatorShellChrome } from "@/lib/operator/operator-shell-access-gate";

/** True while operator shell chrome (sidebar/top bar) must stay hidden pending authority or home access. */
export function useOperatorShellChromeDeferred(): boolean {
  const pathname = usePathname();
  const { isAuthorityLoading } = useOperatorNavAuthority();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // SSR and the first client paint must agree: `unsignedJwtSessionBlocksOperatorShell` reads
    // `window` during render, so defer chrome until hydration completes (TB-730).
    return true;
  }

  return shouldDeferOperatorShellChrome(pathname, isAuthorityLoading);
}
