"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { Button } from "@/components/ui/button";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  enterpriseStatusTagClass,
  OPERATOR_SHELL_TOOLBAR_CONTROL_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  SECURITY_WORKING_CAREER_HONESTY_STRIP_HELP_TEST_ID,
  SECURITY_WORKING_CAREER_HONESTY_STRIP_TEST_ID,
  shouldShowSecurityWorkingCareerHonestyStrip,
} from "@/lib/governance/security-working-career-honesty-strip";
import {
  SECURITY_WORKING_CAREER_HONESTY_STRIP_BODY,
  SECURITY_WORKING_CAREER_HONESTY_STRIP_HELP_LABEL,
  SECURITY_WORKING_CAREER_HONESTY_STRIP_TITLE,
} from "@/lib/governance/working-career-rehearsal-door-copy";
import { WORKING_CAREER_REHEARSAL_HELP_SECURITY_HREF } from "@/lib/governance/working-career-rehearsal-help-route";
import { cn } from "@/lib/utils";

/**
 * Working Security top-bar honesty when the Career / Rehearsal chooser is skipped.
 * Static label — does not PUT the door and does not flip host execute mode.
 */
export function SecurityWorkingCareerHonestyStrip(): ReactElement | null {
  const { productLine } = useProductLine();
  const { mode, mounted } = useWorkspaceMode();

  if (
    !shouldShowSecurityWorkingCareerHonestyStrip({
      productLine,
      workspaceMode: mode,
      workspaceMounted: mounted,
      buyerPolishedEvalChrome: isBuyerPolishedOperatorShellEnv(),
    })
  ) {
    return null;
  }

  return (
    <span
      className="inline-flex max-w-[min(100%,22rem)] items-center gap-1.5 sm:max-w-none"
      data-testid={SECURITY_WORKING_CAREER_HONESTY_STRIP_TEST_ID}
      role="status"
    >
      <span
        className={cn(
          enterpriseStatusTagClass("needs-attention"),
          "inline-flex items-center rounded-md border px-2.5 py-1",
          OPERATOR_TYPOGRAPHY.badge,
          "font-medium",
        )}
        title={SECURITY_WORKING_CAREER_HONESTY_STRIP_BODY}
      >
        {SECURITY_WORKING_CAREER_HONESTY_STRIP_TITLE}
      </span>
      <Button
        asChild
        size="sm"
        variant="outline"
        className={OPERATOR_SHELL_TOOLBAR_CONTROL_CLASS}
      >
        <Link
          href={WORKING_CAREER_REHEARSAL_HELP_SECURITY_HREF}
          data-testid={SECURITY_WORKING_CAREER_HONESTY_STRIP_HELP_TEST_ID}
        >
          {SECURITY_WORKING_CAREER_HONESTY_STRIP_HELP_LABEL}
        </Link>
      </Button>
    </span>
  );
}
