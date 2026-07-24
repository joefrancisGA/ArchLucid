"use client";

import Link from "next/link";
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";

import {
  trackLiveDemoArtifactOpened,
  trackLiveDemoConversionClick,
  type LiveDemoConversionAction,
} from "@/lib/live-demo-telemetry";

type LiveDemoTrackedLinkBaseProps = Omit<ComponentPropsWithoutRef<typeof Link>, "onClick"> & {
  readonly children: ReactNode;
};

export type LiveDemoTrackedLinkProps = LiveDemoTrackedLinkBaseProps &
  (
    | { readonly trackKind: "artifact"; readonly trackValue: string }
    | { readonly trackKind: "conversion"; readonly trackValue: LiveDemoConversionAction }
  );

/**
 * Client Link used from server-rendered live-demo steps so telemetry onClick
 * stays on the client boundary (RSC cannot serialize event handlers).
 */
export const LiveDemoTrackedLink = forwardRef<HTMLAnchorElement, LiveDemoTrackedLinkProps>(
  function LiveDemoTrackedLink(props, ref) {
    const { trackKind, trackValue, children, ...linkProps } = props;

    return (
      <Link
        {...linkProps}
        ref={ref}
        onClick={() => {
          switch (trackKind) {
            case "artifact":
              trackLiveDemoArtifactOpened(trackValue);
              return;
            case "conversion":
              trackLiveDemoConversionClick(trackValue);
              return;
            default: {
              const _exhaustive: never = trackKind;
              return _exhaustive;
            }
          }
        }}
      >
        {children}
      </Link>
    );
  },
);
