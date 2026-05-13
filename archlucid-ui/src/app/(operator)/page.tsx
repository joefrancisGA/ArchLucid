import type { Metadata } from "next";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { OperatorHomePageView } from "./_sections/OperatorHomePageView";

export const metadata: Metadata = {
  title: "Operator home",
};

export default function HomePage() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return <OperatorHomePageView model={{ buyerPolishedShell }} />;
}
