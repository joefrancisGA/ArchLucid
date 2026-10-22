"use client";

import { useCallback, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { resolveOperatorShellAuditRunId } from "@/lib/resolve-operator-shell-audit-run-id";
import { readBuyerCtoDemoTourActive } from "@/lib/buyer/buyer-cto-demo-tour";
import {
  CTO_DEMO_AUDIT_FILTER_QUERY_PARAM,
  CTO_DEMO_AUDIT_FILTER_VALUE,
} from "@/lib/cto-demo-audit-filter";

export function useAuditPageUrlState(options: {
  runId: string;
  setRunId: (runId: string) => void;
}): void {
  const { setRunId } = options;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const workspaceRun = useWorkspaceActiveRun();

  useEffect(() => {
    const fromQuery = searchParams.get("runId")?.trim() ?? "";

    if (fromQuery.length > 0) {
      setRunId(fromQuery);
      return;
    }

    const resolvedRunId = resolveOperatorShellAuditRunId({
      pathname: pathname ?? GOVERNANCE_AUDIT_PATH,
      search: searchParams.toString(),
      workspaceActiveRunId: workspaceRun?.activeRunId ?? null,
    });

    if (resolvedRunId === null || resolvedRunId.length === 0) {
      return;
    }

    router.replace(auditTrailNavHref(resolvedRunId), { scroll: false });
    setRunId(resolvedRunId);
  }, [pathname, router, searchParams, setRunId, workspaceRun?.activeRunId]);

  useEffect(() => {
    if (typeof window === "undefined" || !readBuyerCtoDemoTourActive()) {
      return;
    }

    const existingFilter = searchParams.get(CTO_DEMO_AUDIT_FILTER_QUERY_PARAM);
    if (existingFilter !== null && existingFilter.trim().length > 0) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set(CTO_DEMO_AUDIT_FILTER_QUERY_PARAM, CTO_DEMO_AUDIT_FILTER_VALUE);
    router.replace(`${GOVERNANCE_AUDIT_PATH}?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);
}
