"use client";

import { useRef } from "react";

import {
  captureOperatorScopeWriteStamp,
  type OperatorScopeWriteStamp,
} from "@/lib/operator/operator-scope-write-stamp";

/** Captures proxy scope headers once per mount for livelihood write-path checks (LW-087). */
export function useOperatorScopeWriteStamp(): OperatorScopeWriteStamp {
  const stampRef = useRef<OperatorScopeWriteStamp | null>(null);

  if (stampRef.current === null) {
    stampRef.current = captureOperatorScopeWriteStamp();
  }

  return stampRef.current;
}
