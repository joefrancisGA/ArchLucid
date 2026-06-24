import type { Metadata } from "next";

import { CtoDemoExecutiveLandingRedirect } from "@/components/cto-demo/CtoDemoExecutiveLandingRedirect";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { OperatorHomePageView } from "./_sections/OperatorHomePageView";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.home,
};

export default function HomePage() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <>
      <CtoDemoExecutiveLandingRedirect />
      <OperatorHomePageView model={{ buyerPolishedShell }} />
    </>
  );
}
