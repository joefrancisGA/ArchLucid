import { redirect } from "next/navigation";

import { buildWorkspaceHealthRedirectHref } from "@/lib/workspace-health-route";

type GovernanceDashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Legacy bookmark shim: forward query parameters to the canonical Insights page.
 * Keep this a temporary redirect: a permanent redirect could be cached despite
 * the bookmark carrying per-request operator/workspace query context.
 */
export default async function GovernanceDashboardPage(props: GovernanceDashboardPageProps) {
  const resolved = await props.searchParams;

  redirect(buildWorkspaceHealthRedirectHref(resolved));
}
