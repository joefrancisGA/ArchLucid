"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

import { hideArchitectureIntelligenceBuyerLabControls } from "./architecture-intelligence-buyer-lab-controls";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";

type ArchitectureIntelligenceBuyerLabControlsGateProps = {
  readonly children: ReactNode;
};

/**
 * Buyer default: hide golden-test and load-fixture controls without editing the dirty page client.
 * Full operator chrome (`NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator` or the full-operator cookie) keeps them.
 */
export function ArchitectureIntelligenceBuyerLabControlsGate(
  props: ArchitectureIntelligenceBuyerLabControlsGateProps,
) {
  const { children } = props;
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;

    if (root === null || isOperatorExperienceFullShellEnv()) {
      return;
    }

    hideArchitectureIntelligenceBuyerLabControls(root);

    // Buttons render after product-context fetch, so watch for late mounts.
    const observer = new MutationObserver(() => {
      hideArchitectureIntelligenceBuyerLabControls(root);
    });

    observer.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div data-testid="architecture-intelligence-buyer-lab-controls-gate" ref={rootRef}>
      {children}
    </div>
  );
}
