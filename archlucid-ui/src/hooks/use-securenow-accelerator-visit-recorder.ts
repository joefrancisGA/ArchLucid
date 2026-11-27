"use client";

import { useEffect } from "react";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { recordSecureNowAcceleratorOpen } from "@/lib/product-line/securenow-resume-accelerator-open";

export function useSecureNowAcceleratorVisitRecorder(input: {
  readonly href: string;
  readonly label: string;
}): void {
  const scope = useOperatorScopeQueryKey();

  useEffect(() => {
    recordSecureNowAcceleratorOpen(scope, input);
  }, [input.href, input.label, scope]);
}
