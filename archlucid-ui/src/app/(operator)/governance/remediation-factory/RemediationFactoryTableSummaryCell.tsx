"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { cn } from "@/lib/utils";

const SUMMARY_DISCLOSURE_PARAM = "remediationFactorySummary";

export function remediationFactorySummaryDisclosureHref(
  pathname: string,
  currentSearch: string,
  rowKey: string,
  open: boolean,
): string {
  const params = new URLSearchParams(currentSearch);
  const key = `${SUMMARY_DISCLOSURE_PARAM}:${rowKey}`;

  if (open) {
    params.set(key, "1");
  } else {
    params.delete(key);
  }

  const query = params.toString();

  return query.length > 0 ? `${pathname}?${query}` : pathname;
}

export function isRemediationFactorySummaryDisclosureOpen(
  currentSearch: string,
  rowKey: string,
): boolean {
  const params = new URLSearchParams(currentSearch);
  const raw = params.get(`${SUMMARY_DISCLOSURE_PARAM}:${rowKey}`)?.trim().toLowerCase();

  return raw === "1" || raw === "true";
}

export function RemediationFactoryTableSummaryCell(props: {
  readonly rowKey: string;
  readonly summary: string;
}): React.JSX.Element {
  const pathname = usePathname() ?? "/governance/remediation-factory";
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const open = isRemediationFactorySummaryDisclosureOpen(search, props.rowKey);

  if (props.summary.length <= 96) {
    return <span className={OPERATOR_TYPOGRAPHY.body}>{props.summary}</span>;
  }

  const preview = `${props.summary.slice(0, 96)}…`;

  return (
    <div className="max-w-md space-y-1">
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{open ? props.summary : preview}</p>
      <Link
        href={remediationFactorySummaryDisclosureHref(pathname, search, props.rowKey, !open)}
        className="text-al-link text-sm underline-offset-2 hover:underline"
        data-testid={`remediation-factory-summary-disclosure-${props.rowKey}`}
        scroll={false}
      >
        {open ? "Hide full summary" : "Show full summary"}
      </Link>
    </div>
  );
}
