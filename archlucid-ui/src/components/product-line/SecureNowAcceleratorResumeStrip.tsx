"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SECURENOW_ACCELERATOR_BROWSER_MEMORY_LINE } from "@/lib/product-line/securenow-accelerator-wave-b-honesty-copy";
import { readSecureNowResumeAcceleratorOpen } from "@/lib/product-line/securenow-resume-accelerator-open";

export function SecureNowAcceleratorResumeStrip(): React.JSX.Element | null {
  const scope = useOperatorScopeQueryKey();
  const [resume, setResume] = useState(() => readSecureNowResumeAcceleratorOpen(scope));

  useEffect(() => {
    setResume(readSecureNowResumeAcceleratorOpen(scope));
  }, [scope]);

  if (resume === null) {
    return null;
  }

  return (
    <div className="rounded border border-border bg-muted/20 p-3" data-testid="securenow-accelerator-resume-strip">
      <p className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_ACCELERATOR_BROWSER_MEMORY_LINE}</p>
      <p className={OPERATOR_TYPOGRAPHY.body}>
        Resume:{" "}
        <Link href={resume.href} className={OPERATOR_LINK.inline} data-testid="securenow-accelerator-resume-link">
          {resume.label}
        </Link>
      </p>
    </div>
  );
}
