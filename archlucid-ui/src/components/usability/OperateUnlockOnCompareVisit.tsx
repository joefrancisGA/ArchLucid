"use client";

import { useEffect } from "react";

import { advanceOperateNavUnlockToGovernance } from "@/lib/usability/operate-nav-progressive-unlock";

/** Visiting Compare advances Operate unlock to governance phase (phase 2). */
export function OperateUnlockOnCompareVisit() {
  useEffect(() => {
    advanceOperateNavUnlockToGovernance();
  }, []);

  return null;
}
