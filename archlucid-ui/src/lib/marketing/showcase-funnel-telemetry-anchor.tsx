"use client";

import Link from "next/link";
import type { MouseEvent, ReactElement, ReactNode } from "react";

import {
  recordShowcaseFunnelEvent,
  type ShowcaseFunnelAction,
  type ShowcaseRenderMode,
} from "@/lib/marketing/showcase-telemetry";

type ShowcaseFunnelTelemetryAnchorProps = {
  readonly href: string;
  readonly className?: string;
  readonly children: ReactNode;
  readonly scenario: string;
  readonly renderMode: ShowcaseRenderMode;
  readonly funnelAction: ShowcaseFunnelAction;
  readonly "data-testid"?: string;
};

export function ShowcaseFunnelTelemetryAnchor({
  href,
  className,
  children,
  scenario,
  renderMode,
  funnelAction,
  "data-testid": dataTestId,
}: ShowcaseFunnelTelemetryAnchorProps): ReactElement {
  function onClick(event: MouseEvent<HTMLAnchorElement>): void {
    recordShowcaseFunnelEvent(funnelAction, { scenario, renderMode });
  }

  return (
    <Link href={href} className={className} onClick={onClick} data-testid={dataTestId}>
      {children}
    </Link>
  );
}
