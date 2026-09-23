"use client";

import Link from "next/link";

import { useArchitectureIdentityQuery } from "@/hooks/use-architecture-identity-query";
import {
  ARCHITECTURES_LIST_PATH,
  architectureIdentityPath,
} from "@/lib/architecture/architecture-routes";
import {
  WORKING_ARCHITECTURE_NESTED_BREADCRUMB_ARCHITECTURES_LABEL,
  WORKING_ARCHITECTURE_NESTED_BREADCRUMB_DESK_LABEL,
} from "@/lib/architecture/working-architecture-nested-tool-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type WorkingArchitectureNestedWayfindingProps = {
  readonly architectureId: string;
  readonly toolLabel: string;
};

/** Working nested tool breadcrumb trail — slug disclosure lives in identity chrome only. */
export function WorkingArchitectureNestedWayfinding(
  props: WorkingArchitectureNestedWayfindingProps,
): React.JSX.Element {
  const architectureId = props.architectureId.trim();
  const query = useArchitectureIdentityQuery(architectureId);
  const displayName = query.data?.displayName?.trim() ?? WORKING_ARCHITECTURE_NESTED_BREADCRUMB_DESK_LABEL;
  const deskHref = architectureIdentityPath(architectureId);

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("mb-1", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="working-architecture-nested-wayfinding"
    >
      <ol className="m-0 flex list-none flex-wrap items-center gap-x-1.5 gap-y-1 p-0">
        <li>
          <Link className={OPERATOR_LINK.inline} href={ARCHITECTURES_LIST_PATH}>
            {WORKING_ARCHITECTURE_NESTED_BREADCRUMB_ARCHITECTURES_LABEL}
          </Link>
        </li>
        <li aria-hidden="true" className="text-al-text-secondary">/</li>
        <li className="min-w-0">
          <Link className={cn(OPERATOR_LINK.inline, "max-w-[14rem] truncate")} href={deskHref} title={displayName}>
            {displayName}
          </Link>
        </li>
        <li aria-hidden="true" className="text-al-text-secondary">/</li>
        <li aria-current="page" className="text-al-text-primary">
          {props.toolLabel}
        </li>
      </ol>
    </nav>
  );
}
