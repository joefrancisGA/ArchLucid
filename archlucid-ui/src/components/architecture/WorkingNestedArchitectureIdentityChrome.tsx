"use client";

import Link from "next/link";

import { StatusTag } from "@/components/ui/status-tag";
import { TechnicalIdDisclosure } from "@/components/usability/TechnicalIdDisclosure";
import { useArchitectureIdentityQuery } from "@/hooks/use-architecture-identity-query";
import { architectureIdentityPath } from "@/lib/architecture/architecture-routes";
import {
  WORKING_ARCHITECTURE_NESTED_ARCHITECTURE_SLUG_LABEL,
  WORKING_ARCHITECTURE_NESTED_IDENTITY_LOADING_LABEL,
  WORKING_ARCHITECTURE_NESTED_IDENTITY_UNAVAILABLE_LABEL,
} from "@/lib/architecture/working-architecture-nested-tool-copy";
import {
  SYSTEM_NOT_JOB_SEALED_CHILD_BACK_DOM_TEST_ID,
  SYSTEM_NOT_JOB_SEALED_CHILD_BACK_LABEL,
} from "@/lib/system-not-job-sealed-child-not-second-desk";
import type { EnterpriseStatusKind } from "@/lib/design-tokens-status";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ArchitectureIdentityDetail } from "@/types/architecture-identity";
import { cn } from "@/lib/utils";

type WorkingNestedArchitectureIdentityChromeProps = {
  readonly architectureId: string;
};

type ArchitectureIdentityStatusPresentation = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

function resolveArchitectureIdentityStatusPresentation(
  identity: ArchitectureIdentityDetail | undefined,
  isLoading: boolean,
  isError: boolean,
): ArchitectureIdentityStatusPresentation {
  if (isLoading) {
    return { kind: "in-progress", label: WORKING_ARCHITECTURE_NESTED_IDENTITY_LOADING_LABEL };
  }

  if (isError || identity === undefined) {
    return { kind: "needs-attention", label: WORKING_ARCHITECTURE_NESTED_IDENTITY_UNAVAILABLE_LABEL };
  }

  if ((identity.archivedUtc?.trim() ?? "").length > 0) {
    return { kind: "blocked", label: "Archived" };
  }

  return { kind: "ready", label: "Active" };
}

export function WorkingNestedArchitectureIdentityChrome(
  props: WorkingNestedArchitectureIdentityChromeProps,
): React.JSX.Element {
  const query = useArchitectureIdentityQuery(props.architectureId);
  const identity = query.data;
  const displayName = identity?.displayName?.trim() ?? "Architecture";
  const status = resolveArchitectureIdentityStatusPresentation(identity, query.isLoading, query.isError);
  const deskHref = architectureIdentityPath(props.architectureId);

  return (
    <div
      data-testid="working-nested-architecture-identity-chrome"
      className={cn(
        "sticky top-0 z-[5] mb-2 flex min-h-10 flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-neutral-200 bg-white/95 px-3 py-2 backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-950/95",
        OPERATOR_TYPOGRAPHY.helper,
      )}
    >
      <span className="shrink-0 text-al-text-secondary">Architecture</span>
      <Link
        href={deskHref}
        className={cn(OPERATOR_LINK.nav, "min-w-0 truncate font-medium text-al-text-primary")}
      >
        {displayName}
      </Link>
      <StatusTag kind={status.kind} label={status.label} data-testid="working-nested-architecture-identity-status" />
      <TechnicalIdDisclosure
        label={WORKING_ARCHITECTURE_NESTED_ARCHITECTURE_SLUG_LABEL}
        value={props.architectureId}
        disclosureKey={`architecture-slug-chrome-${props.architectureId}`}
      />
      {query.blockedReason !== null ? (
        <span className="min-w-0 text-al-text-secondary" data-testid="working-nested-architecture-identity-blocked-reason">
          {query.blockedReason}
        </span>
      ) : null}
      <Link
        href={deskHref}
        className={cn(OPERATOR_LINK.inline, "ml-auto shrink-0")}
        data-testid={SYSTEM_NOT_JOB_SEALED_CHILD_BACK_DOM_TEST_ID}
      >
        {SYSTEM_NOT_JOB_SEALED_CHILD_BACK_LABEL}
      </Link>
    </div>
  );
}
