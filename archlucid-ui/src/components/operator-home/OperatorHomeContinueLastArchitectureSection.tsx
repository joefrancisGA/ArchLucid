"use client";

import { useMemo } from "react";

import { ArchitectureIdentityContinueLastRow } from "@/components/reviews/ArchitectureIdentityContinueLastRow";
import { resolveContinueLastArchitectureIdentityTarget } from "@/lib/resolve-continue-last-architecture-identity";

export type OperatorHomeContinueLastArchitectureSectionProps = {
  readonly buttonVariant?: "primary" | "outline";
};

/** Working Home resume row for the last-open architecture identity desk (CA-37). */
export function OperatorHomeContinueLastArchitectureSection(
  props: OperatorHomeContinueLastArchitectureSectionProps,
): React.JSX.Element | null {
  const target = useMemo(() => resolveContinueLastArchitectureIdentityTarget(), []);

  if (target === null) {
    return null;
  }

  return (
    <ArchitectureIdentityContinueLastRow
      target={target}
      buttonVariant={props.buttonVariant ?? "primary"}
    />
  );
}
