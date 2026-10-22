import { GOVERNANCE_SETUP_PAGE_SUBTITLE } from "@/lib/governance/governance-setup-route";
import { GOVERNANCE_SETUP_PAGE_SUBTITLE_BUYER } from "@/lib/governance-setup-page-copy";

export function governanceSetupPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? GOVERNANCE_SETUP_PAGE_SUBTITLE_BUYER : GOVERNANCE_SETUP_PAGE_SUBTITLE;
}
