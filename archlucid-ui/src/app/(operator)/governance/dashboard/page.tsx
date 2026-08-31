import { permanentRedirect } from "next/navigation";

import { buildWorkspaceHealthRedirectHref } from "@/lib/workspace-health-route";

type GovernanceDashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy bookmark shim — workspace health KPIs live on Insights. */
export default async function GovernanceDashboardPage(props: GovernanceDashboardPageProps) {
  const resolved = await props.searchParams;

  permanentRedirect(buildWorkspaceHealthRedirectHref(resolved));
}
