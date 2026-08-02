import { redirect } from "next/navigation";

import { buildSnapshotRedirectPath } from "@/lib/legacy-snapshot-redirect";

type SnapshotPageProps = {
  readonly params: Promise<{ runId: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy snapshot leave-behind — redirects to review workspace read-only mode, never sponsor-report (TB-1952). */
export default async function SnapshotPage(props: SnapshotPageProps): Promise<never> {
  const { runId } = await props.params;
  const searchParams = await props.searchParams;

  redirect(buildSnapshotRedirectPath(runId, searchParams));
}
