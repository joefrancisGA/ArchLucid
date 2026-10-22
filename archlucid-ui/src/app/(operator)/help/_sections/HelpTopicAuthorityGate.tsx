"use client";

import { useOperatorNavAuthority, useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { OperatorShellAccessGateLoading } from "@/components/operator/OperatorShellAccessGateLoading";
import { callerCanAccessHelpTopic } from "@/lib/product-documentation-access";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

export type HelpTopicAuthorityGateProps = {
  readonly entry: ProductDocumentationEntry;
  readonly denied: React.ReactNode;
  readonly children: React.ReactNode;
};

/**
 * Client-side enforcement for admin-only help topics when JWT tokens live in sessionStorage (TB-735).
 */
export function HelpTopicAuthorityGate(props: HelpTopicAuthorityGateProps): React.ReactElement {
  const { isAuthorityLoading } = useOperatorNavAuthority();
  const callerAuthorityRank = useNavCallerAuthorityRank();

  if (isAuthorityLoading) {
    return <OperatorShellAccessGateLoading />;
  }

  if (!callerCanAccessHelpTopic(props.entry, callerAuthorityRank)) {
    return <>{props.denied}</>;
  }

  return <>{props.children}</>;
}
