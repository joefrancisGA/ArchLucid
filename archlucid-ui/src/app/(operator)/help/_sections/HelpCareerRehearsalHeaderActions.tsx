import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  CAREER_REHEARSAL_HELP_PRIMARY_ACTION,
  CAREER_REHEARSAL_HELP_SECURITY_TRUST_ACTION,
} from "@/lib/career-rehearsal-help-guide-content";

/** Header actions for `/help/career-vs-rehearsal` (AS-082 / ECX). */
export function HelpCareerRehearsalHeaderActions(): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-career-vs-rehearsal-header-actions">
      <Button asChild data-testid={CAREER_REHEARSAL_HELP_PRIMARY_ACTION.testId} size="sm" variant="primary">
        <Link href={CAREER_REHEARSAL_HELP_PRIMARY_ACTION.href}>{CAREER_REHEARSAL_HELP_PRIMARY_ACTION.label}</Link>
      </Button>
      <Button asChild data-testid={CAREER_REHEARSAL_HELP_SECURITY_TRUST_ACTION.testId} size="sm" variant="secondary">
        <Link href={CAREER_REHEARSAL_HELP_SECURITY_TRUST_ACTION.href}>
          {CAREER_REHEARSAL_HELP_SECURITY_TRUST_ACTION.label}
        </Link>
      </Button>
    </div>
  );
}
