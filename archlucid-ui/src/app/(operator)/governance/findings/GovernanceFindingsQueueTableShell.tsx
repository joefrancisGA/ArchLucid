"use client";

import { GovernanceFindingsQueueAssignedToMeShell } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueAssignedToMeShell";
import type { GovernanceFindingsQueueAssignedToMeShellProps } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueAssignedToMeShell";

export type GovernanceFindingsQueueTableShellProps = GovernanceFindingsQueueAssignedToMeShellProps;

export function GovernanceFindingsQueueTableShell(
  props: GovernanceFindingsQueueTableShellProps,
): React.JSX.Element {
  return <GovernanceFindingsQueueAssignedToMeShell {...props} />;
}
