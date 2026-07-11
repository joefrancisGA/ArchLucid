import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

import { MARKETING_LAYOUT } from "@/lib/design-tokens";

type MarketingPageShellProps = {
  readonly children: ReactNode;
  readonly variant?: "default" | "reading" | "trust";
  readonly className?: string;
  readonly id?: string;
  readonly "data-testid"?: string;
};

/** Shared marketing page rail — aligns public routes with operator shell tokens and density. */
export function MarketingPageShell(props: MarketingPageShellProps) {
  const { children, variant = "default", className, id = "main-content", "data-testid": dataTestId } = props;
  const widthClass =
    variant === "trust"
      ? MARKETING_LAYOUT.mainTrust
      : variant === "reading"
        ? MARKETING_LAYOUT.mainReading
        : MARKETING_LAYOUT.main;

  return (
    <main id={id} className={cn(widthClass, className)} tabIndex={-1} data-testid={dataTestId}>
      {children}
    </main>
  );
}
