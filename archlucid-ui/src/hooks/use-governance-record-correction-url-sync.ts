"use client";

import { useCallback, useEffect, useState, type SetStateAction } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { GovernanceMutationCorrectionTarget } from "@/lib/governance/governance-mutation-correction-api";
import {
  governanceRecordCorrectionConfirmHrefFromSearch,
  parseGovernanceRecordCorrectionKindFromSearch,
  parseGovernanceRecordCorrectionRunIdFromSearch,
  parseGovernanceRecordCorrectionSubjectIdFromSearch,
} from "@/lib/governance/governance-record-correction-confirm-url";

type UseGovernanceRecordCorrectionUrlSyncArgs = {
  readonly correctionTarget: GovernanceMutationCorrectionTarget | null;
};

type UseGovernanceRecordCorrectionUrlSyncResult = {
  readonly correctionDialogOpen: boolean;
  readonly setCorrectionDialogOpen: (value: SetStateAction<boolean>) => void;
};

export function useGovernanceRecordCorrectionUrlSync(
  args: UseGovernanceRecordCorrectionUrlSyncArgs,
): UseGovernanceRecordCorrectionUrlSyncResult {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const govCorrectionKindParam = searchParams.get("govCorrectionKind");
  const govCorrectionSubjectIdParam = searchParams.get("govCorrectionSubjectId");
  const govCorrectionRunIdParam = searchParams.get("govCorrectionRunId");
  const [correctionDialogOpen, setCorrectionDialogOpenState] = useState(() => {
    const kind = parseGovernanceRecordCorrectionKindFromSearch(govCorrectionKindParam);
    const subjectId = parseGovernanceRecordCorrectionSubjectIdFromSearch(govCorrectionSubjectIdParam);
    const runId = parseGovernanceRecordCorrectionRunIdFromSearch(govCorrectionRunIdParam);

    return kind.length > 0 && subjectId.length > 0 && runId.length > 0;
  });

  const syncCorrectionToUrl = useCallback(
    (open: boolean, target: GovernanceMutationCorrectionTarget | null) => {
      if (pathname.length === 0) {
        return;
      }

      router.replace(
        governanceRecordCorrectionConfirmHrefFromSearch(
          searchParams.toString(),
          open && target !== null
            ? {
                mutationKind: target.mutationKind,
                subjectId: target.subjectId,
                runId: target.runId,
              }
            : { mutationKind: null, subjectId: null, runId: null },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setCorrectionDialogOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setCorrectionDialogOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncCorrectionToUrl(next, args.correctionTarget);

        return next;
      });
    },
    [args.correctionTarget, syncCorrectionToUrl],
  );

  useEffect(() => {
    const kind = parseGovernanceRecordCorrectionKindFromSearch(govCorrectionKindParam);
    const subjectId = parseGovernanceRecordCorrectionSubjectIdFromSearch(govCorrectionSubjectIdParam);
    const runId = parseGovernanceRecordCorrectionRunIdFromSearch(govCorrectionRunIdParam);

    if (kind.length === 0 || subjectId.length === 0 || runId.length === 0) {
      setCorrectionDialogOpenState(false);

      return;
    }

    if (args.correctionTarget === null) {
      return;
    }

    if (
      args.correctionTarget.mutationKind !== kind
      || args.correctionTarget.subjectId !== subjectId
      || args.correctionTarget.runId !== runId
    ) {
      setCorrectionDialogOpenState(false);

      return;
    }

    setCorrectionDialogOpenState(true);
  }, [
    args.correctionTarget,
    govCorrectionKindParam,
    govCorrectionRunIdParam,
    govCorrectionSubjectIdParam,
  ]);

  return {
    correctionDialogOpen,
    setCorrectionDialogOpen,
  };
}
