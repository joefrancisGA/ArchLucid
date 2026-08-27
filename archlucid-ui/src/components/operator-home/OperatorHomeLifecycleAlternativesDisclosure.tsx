"use client";

import { OperatorHomeDualPathCards } from "@/components/operator-home/OperatorHomeDualPathCards";
import type { OperatorHomeLifecyclePath } from "@/lib/resolve-operator-home-workspace-phase";

type OperatorHomeLifecycleAlternativesDisclosureProps = {
  readonly emphasizedPath: OperatorHomeLifecyclePath | null;
  readonly pagePrimaryOwnedElsewhere?: boolean;
  readonly hideExplorePath?: boolean;
};

/**
 * Lifecycle entry cards — always visible on Home; resume/draft primaries stay in the header row.
 */
export function OperatorHomeLifecycleAlternativesDisclosure(
  props: OperatorHomeLifecycleAlternativesDisclosureProps,
): React.JSX.Element {
  return (
    <OperatorHomeDualPathCards
      emphasizedPath={props.emphasizedPath}
      pagePrimaryOwnedElsewhere={props.pagePrimaryOwnedElsewhere === true}
      hideExplorePath={props.hideExplorePath}
    />
  );
}
