import { redirect } from "next/navigation";

import { ADVISORY_SCANS_HREF, ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import { advisoryHubTabFromSearchParam } from "@/lib/advisory-hub-tab";

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

/** Legacy top-level route — permanent home is `/governance/advisory-scans` (TB-1124). */
export default async function AdvisoryLegacyRedirect(props: PageProps) {
  const p = await props.searchParams;
  const tab = advisoryHubTabFromSearchParam(p.tab ?? null);

  if (tab === "schedules") {
    redirect(ADVISORY_SCANS_SCHEDULES_HREF);
  }

  redirect(ADVISORY_SCANS_HREF);
}
