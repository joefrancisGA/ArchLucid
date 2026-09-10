"use client";

import { Suspense } from "react";

import { CompareForm } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareForm";
import { CompareSuspenseFallback } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareSuspenseFallback";
import { ArchitectureNestedToolScopeSeed } from "@/components/architecture/ArchitectureNestedToolScopeSeed";
import { OperateUnlockOnCompareVisit } from "@/components/usability/OperateUnlockOnCompareVisit";
import { architectureNestedComparePath } from "@/lib/architecture/architecture-routes";

export type ArchitectureNestedComparePageClientProps = {
  readonly architectureId: string;
};

/** Working nested Compare — mounts peer Compare client under the architecture desk (ADR 0079 / SY-38). */
export function ArchitectureNestedComparePageClient(
  props: ArchitectureNestedComparePageClientProps,
): React.JSX.Element {
  const architectureId = props.architectureId.trim();

  return (
    <Suspense fallback={<CompareSuspenseFallback />}>
      <ArchitectureNestedToolScopeSeed architectureId={architectureId} queryParam="architectureId" />
      <OperateUnlockOnCompareVisit />
      <CompareForm basePathname={architectureNestedComparePath(architectureId)} />
    </Suspense>
  );
}
