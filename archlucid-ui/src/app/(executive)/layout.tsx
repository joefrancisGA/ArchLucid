import type { ReactNode } from "react";

import { ExecutiveShellFrame } from "@/components/ExecutiveShellFrame";
import { OperatorNavAuthorityProvider } from "@/components/OperatorNavAuthorityProvider";

/** Executive routes inherit dynamic rendering from leaf loaders (`cache: "no-store"` fetches). */
export default function ExecutiveLayout({ children }: { children: ReactNode }) {
  return (
    <OperatorNavAuthorityProvider>
      <ExecutiveShellFrame>{children}</ExecutiveShellFrame>
    </OperatorNavAuthorityProvider>
  );
}
