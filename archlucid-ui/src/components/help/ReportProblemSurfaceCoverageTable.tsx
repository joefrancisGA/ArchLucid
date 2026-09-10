"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { HelpLazyDetails } from "@/components/help/HelpLazyDetails";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { REPORT_PROBLEM_V1_SURFACES } from "@/lib/report-problem-surfaces";
import {
  parseReportProblemSurfaceTechKeyFromSearch,
  reportProblemSurfaceTechDisclosureHrefFromSearch,
} from "@/lib/support/report-problem-surface-tech-disclosure-url";
import { cn } from "@/lib/utils";

const VALIDATION_ONLY_400_EXCLUSION =
  "Validation-only HTTP 400 responses (field validation) do not show Report problem unless the registry is expanded.";

/** Enumerates the Report problem surface registry for the help topic. */
export function ReportProblemSurfaceCoverageTable(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const reportProblemSurfaceTechKeyParam = searchParams.get("reportProblemSurfaceTechKey");
  const [openSurfaceTechKey, setOpenSurfaceTechKeyState] = useState(() =>
    parseReportProblemSurfaceTechKeyFromSearch(reportProblemSurfaceTechKeyParam),
  );

  const syncOpenSurfaceTechToUrl = useCallback(
    (surfaceId: string | null) => {
      router.replace(
        reportProblemSurfaceTechDisclosureHrefFromSearch(searchParams.toString(), surfaceId, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    setOpenSurfaceTechKeyState(parseReportProblemSurfaceTechKeyFromSearch(reportProblemSurfaceTechKeyParam));
  }, [reportProblemSurfaceTechKeyParam]);

  return (
    <section className="mt-4 space-y-2" data-testid="report-problem-surface-coverage">
      <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        Where Report problem appears
      </h2>
      <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Report problem is limited to these high-stakes failure surfaces. {VALIDATION_ONLY_400_EXCLUSION}
      </p>
      <EnterpriseTable ariaLabel="Report problem surface registry">
        <EnterpriseTableHead>
          <EnterpriseTableRow>
            <EnterpriseTableHeaderCell>Surface</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>When it appears</EnterpriseTableHeaderCell>
          </EnterpriseTableRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {REPORT_PROBLEM_V1_SURFACES.map((surface) => (
            <EnterpriseTableRow key={surface.id}>
              <EnterpriseTableCell>
                <div className="space-y-1">
                  <span className={OPERATOR_TYPOGRAPHY.body}>{surface.id}</span>
                  <HelpLazyDetails
                    summary="Technical details"
                    data-testid={`report-problem-surface-tech-${surface.id}`}
                    bodyTestId={`report-problem-surface-tech-body-${surface.id}`}
                    open={openSurfaceTechKey === surface.id}
                    onOpenChange={(detailsOpen) => {
                      const nextSurfaceId = detailsOpen ? surface.id : null;
                      setOpenSurfaceTechKeyState(nextSurfaceId ?? "");
                      syncOpenSurfaceTechToUrl(nextSurfaceId);
                    }}
                  >
                    <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      Route pattern: <code>{surface.routePattern}</code>
                    </p>
                    <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      Component: <code>{surface.componentPath}</code>
                    </p>
                  </HelpLazyDetails>
                </div>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <span className={OPERATOR_TYPOGRAPHY.body}>{surface.description}</span>
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </section>
  );
}
