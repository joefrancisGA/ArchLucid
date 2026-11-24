import type { ReactNode } from "react";

import { OperatorQueryProvider } from "@/components/operator/OperatorQueryProvider";
import { SampleReviewsOnOverviewPreferenceProvider } from "@/components/SampleReviewsOnOverviewPreferenceProvider";
import { WhereToGoNextPreferenceProvider } from "@/components/WhereToGoNextPreferenceProvider";
import { OperatorLayoutClient } from "./OperatorLayoutClient";

/**
 * Keep operator-only preferences inside the operator route group, not the root
 * layout: public marketing pages must not hydrate account preference clients.
 * Their original wrapper order is retained within the root workspace/query providers.
 */
export default function OperatorLayout({ children }: { children: ReactNode }) {
  return (
    <OperatorQueryProvider>
      <WhereToGoNextPreferenceProvider>
        <SampleReviewsOnOverviewPreferenceProvider>
          <OperatorLayoutClient>{children}</OperatorLayoutClient>
        </SampleReviewsOnOverviewPreferenceProvider>
      </WhereToGoNextPreferenceProvider>
    </OperatorQueryProvider>
  );
}
