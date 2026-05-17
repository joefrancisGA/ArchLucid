import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GovernanceApprovalRequest } from "@/types/governance-workflow";

/**
 * Buyer-walkthrough summary: one card that narrates submit → review → approve → governed package readiness
 * without surfacing internal approval IDs or environment-promotion framing.
 */
export function GovernanceApprovalStoryCard(props: { readonly row: GovernanceApprovalRequest }) {
  const row = props.row;
  const submitted = row.requestedUtc.trim().length > 0;
  const reviewed = (row.reviewedBy?.trim().length ?? 0) > 0;
  const approved = row.status.trim().toLowerCase() === "approved";
  const promoteReady = approved && reviewed;

  const steps: { label: string; done: boolean; detail: string }[] = [
    {
      label: "Submitted for review",
      done: submitted,
      detail: submitted ? `Requested by ${row.requestedBy}` : "Awaiting submission",
    },
    {
      label: "Architecture review completed",
      done: reviewed,
      detail: reviewed ? `Reviewer ${row.reviewedBy ?? "—"}` : "Pending reviewer action",
    },
    {
      label: "Governance approval recorded",
      done: approved,
      detail: approved ? "Governance approval recorded" : row.status.trim() || "Not approved yet",
    },
    {
      label: "Approved for governed use",
      done: promoteReady,
      detail: promoteReady ? "Citation-ready governance record sealed for downstream planning checkpoints." : "Complete approval before citing this package in downstream decisions.",
    },
  ];

  return (
    <Card className="mb-8 border-teal-200 bg-teal-50/40 dark:border-teal-900 dark:bg-teal-950/25">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-neutral-900 dark:text-neutral-50">
          {approved ? "This package completed the approval path" : "Approval status for this review"}
        </CardTitle>
        <div className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            <p className="m-0 leading-relaxed">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">Approval outcome:</span> Sealed manifest
              version <span className="font-semibold">{row.manifestVersion}</span> is approved for citation in diligence,
              steering, and audit narratives anchored to this review package.
            </p>
            <p className="m-0 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
              Production deployments and downstream change windows still follow your enterprise change board — ArchLucid carries
              the governed architecture evidence; operations teams gate execution separately.
            </p>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="m-0 mb-3 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Approval path for this package
        </p>
        <ol className="m-0 flex list-none flex-col gap-3 p-0 sm:flex-row sm:items-stretch sm:gap-2">
          {steps.map((s, index) => (
            <li key={s.label} className="flex min-w-0 flex-1 sm:items-stretch">
              {index > 0 ? (
                <span
                  aria-hidden
                  className="me-2 hidden w-px shrink-0 self-stretch bg-neutral-300 sm:block dark:bg-neutral-600"
                />
              ) : null}
              <div className="min-w-0 flex-1 rounded-md border border-neutral-200 bg-white/90 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950/40">
                <p className="m-0 flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-50">
                  <span aria-hidden className={s.done ? "text-teal-700 dark:text-teal-300" : "text-neutral-400"}>
                    {s.done ? "✓" : "○"}
                  </span>
                  {s.label}
                </p>
                <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
