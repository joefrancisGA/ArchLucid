"use client";

import Link from "next/link";

import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Live region plus a named link when Home cannot reach the workspace API. */
export function SecureNowWorkspaceApiUnreachableNotice(props: {
  readonly message: string;
  readonly testId: string;
}): React.JSX.Element {
  return (
    <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} role="alert" data-testid={props.testId}>
      {props.message}{" "}
      <Link href={ADMINISTRATION_SYSTEM_HEALTH_PATH} className={OPERATOR_LINK.inline}>
        System health
      </Link>
    </p>
  );
}
