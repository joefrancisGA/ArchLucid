import type { Metadata } from "next";

import { ExecutiveScorecardClient } from "./ExecutiveScorecardClient";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

export const metadata: Metadata = {
  title: BUYER_EXECUTIVE_SUMMARY_VOCABULARY.scorecardPageTitle,
};

export default function ExecutiveScorecardPage() {
  return <ExecutiveScorecardClient />;
}
