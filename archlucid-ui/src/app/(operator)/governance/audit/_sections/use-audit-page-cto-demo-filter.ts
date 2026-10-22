"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import {
  CTO_DEMO_AUDIT_FILTER_QUERY_PARAM,
  isCtoDemoAuditFilterActive,
} from "@/lib/cto-demo-audit-filter";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export function useAuditPageCtoDemoFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ctoDemoAuditFilterActive = isCtoDemoAuditFilterActive(
    searchParams.get(CTO_DEMO_AUDIT_FILTER_QUERY_PARAM),
  );

  const onClearCtoDemoAuditFilter = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(CTO_DEMO_AUDIT_FILTER_QUERY_PARAM);
    const query = params.toString();

    router.replace(
      query.length > 0 ? `${GOVERNANCE_AUDIT_PATH}?${query}` : GOVERNANCE_AUDIT_PATH,
      { scroll: false },
    );
  }, [router, searchParams]);

  return {
    ctoDemoAuditFilterActive,
    onClearCtoDemoAuditFilter,
  };
}
