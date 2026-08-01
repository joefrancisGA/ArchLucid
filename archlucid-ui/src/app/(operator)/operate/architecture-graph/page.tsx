import { redirect } from "next/navigation";

import { buildGraphRedirectPath } from "@/lib/legacy-architecture-graph-redirect";

type ArchitectureGraphOperateRedirectPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy Operate entry — canonical Evidence graph lives on `/graph`. */
export default async function ArchitectureGraphOperateRedirectPage({
  searchParams,
}: ArchitectureGraphOperateRedirectPageProps): Promise<never> {
  const params = await searchParams;

  redirect(buildGraphRedirectPath(params));
}
