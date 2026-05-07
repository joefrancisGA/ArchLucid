"use client";

import { useLayoutEffect, type ReactNode } from "react";

import { useSetOperatorChromeMode } from "@/components/OperatorChromeModeContext";

/**
 * Mounts under the operator shell while a review detail route shows a fatal load/render message so the workspace
 * can drop sidebar + heavy header chrome until the user navigates away.
 */
export function RunDetailMinimalChromeMount(props: { readonly children: ReactNode }) {
  const { children } = props;
  const setChromeMode = useSetOperatorChromeMode();

  useLayoutEffect(() => {
    setChromeMode("minimal");

    return () => {
      setChromeMode("full");
    };
  }, [setChromeMode]);

  return <>{children}</>;
}
