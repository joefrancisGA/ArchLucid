import { redirect } from "next/navigation";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { getShowcaseExecutiveHref } from "@/lib/buyer-safe-review-navigation";

import { WhyArchLucidPage } from "./_sections/WhyArchLucidPage";

/**
 * Internal proof page — hidden from buyer-polished shell where API/test-harness copy would erode trust.
 */
export default function WhyArchLucidRoute() {
  if (isBuyerPolishedOperatorShellEnv()) {
    redirect(getShowcaseExecutiveHref());
  }

  return <WhyArchLucidPage />;
}
