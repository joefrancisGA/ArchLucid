export type WhyArchLucidPageFooterProps = {
  demoRunId: string | null | undefined;
};

export function WhyArchLucidPageFooter(props: WhyArchLucidPageFooterProps) {
  const runIdToken = props.demoRunId ?? "{runId}";

  return (
    <footer className="border-t border-neutral-200 pt-3 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
      Sources: <code>GET /v1/tenant/measured-roi</code>, <code>GET /v1/pilots/sponsor-evidence-pack</code>,{" "}
      <code>GET /v1/pilots/runs/{runIdToken}/first-value-report</code>,{" "}
      <code>GET /v1/explain/runs/{runIdToken}/aggregate</code>. See repo <code>docs/SPONSOR_ONE_PAGER.md</code> and{" "}
      <code>docs/go-to-market/POSITIONING.md</code> for narrative context.
    </footer>
  );
}
