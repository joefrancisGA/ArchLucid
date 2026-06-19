import type { Metadata } from "next";

import { CtoDemoExecutiveLandingRedirect } from "@/components/cto-demo/CtoDemoExecutiveLandingRedirect";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { OperatorHomePageView } from "./_sections/OperatorHomePageView";

export {
  dynamic,
  fetchCache,
  revalidate,
} from "@/lib/next/operator-data-route-policy";

export const metadata: Metadata = {
  title: "Operator home",
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
