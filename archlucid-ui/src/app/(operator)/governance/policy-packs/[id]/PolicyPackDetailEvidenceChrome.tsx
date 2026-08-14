"use client";

import type { ReactNode } from "react";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";

type PolicyPackDetailEvidenceChromeProps = {
  readonly children: ReactNode;
};

/** Shared Evidence chrome for policy pack detail variants (GPI). */
export function PolicyPackDetailEvidenceChrome(
  props: PolicyPackDetailEvidenceChromeProps,
): React.JSX.Element {
  return (
    <div data-testid="policy-pack-detail-evidence-chrome">
      <div className="mx-auto w-full max-w-[1200px] px-4 pt-4">
        <div className="flex justify-end">
          <PageContextualHelpButton />
        </div>
      </div>
      {props.children}
    </div>
  );
}
