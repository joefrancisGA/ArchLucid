"use client";

import { useCallback, useEffect, useState, type SetStateAction } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PolicyPacksPageView } from "./PolicyPacksPageView";
import type { PolicyPacksPageServerLoad } from "./load-policy-packs-page-data";
import { usePolicyPacksPage } from "./use-policy-packs-page";
import {
  LivelihoodDocumentGuardDialog,
  useLivelihoodDocumentGuards,
} from "@/hooks/use-livelihood-document-guards";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import {
  parsePolicyPackAuthoringLeaveConfirmOpenFromSearch,
  policyPackAuthoringLeaveConfirmHrefFromSearch,
} from "@/lib/policy/policy-pack-authoring-leave-confirm-url";
import { policyPackAuthoringHasUnsavedEdits } from "./policy-pack-authoring-unsaved";

type PolicyPacksPageClientProps = {
  readonly loaded: PolicyPacksPageServerLoad;
};

export function PolicyPacksPageClient(props: PolicyPacksPageClientProps) {
  const model = usePolicyPacksPage(props.loaded);
  const router = useRouter();
  const pathname = usePathname() ?? GOVERNANCE_POLICY_PACKS_PATH;
  const searchParams = useSearchParams();
  const packAuthoringLeaveConfirmParam = searchParams.get("packAuthoringLeaveConfirm");
  const hasUnsavedEdits = policyPackAuthoringHasUnsavedEdits({
    createJson: model.createJson,
    name: model.name,
    description: model.description,
    packType: model.packType,
    publishJson: model.publishJson,
    publishBaselineJson: model.publishBaselineJson,
    selectedPackId: model.selectedPackId,
  });
  const documentGuards = useLivelihoodDocumentGuards({ when: hasUnsavedEdits });
  const [guardDialogOpen, setGuardDialogOpenState] = useState(
    () =>
      documentGuards.dialogOpen
      || parsePolicyPackAuthoringLeaveConfirmOpenFromSearch(packAuthoringLeaveConfirmParam),
  );

  const syncAuthoringLeaveConfirmToUrl = useCallback(
    (confirmOpen: boolean) => {
      router.replace(
        policyPackAuthoringLeaveConfirmHrefFromSearch(searchParams.toString(), confirmOpen, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setGuardDialogOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setGuardDialogOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncAuthoringLeaveConfirmToUrl(next);

        return next;
      });
    },
    [syncAuthoringLeaveConfirmToUrl],
  );

  useEffect(() => {
    if (documentGuards.dialogOpen) {
      setGuardDialogOpenState(true);
      syncAuthoringLeaveConfirmToUrl(true);

      return;
    }

    setGuardDialogOpenState(
      parsePolicyPackAuthoringLeaveConfirmOpenFromSearch(packAuthoringLeaveConfirmParam),
    );
  }, [documentGuards.dialogOpen, packAuthoringLeaveConfirmParam, syncAuthoringLeaveConfirmToUrl]);

  const confirmLeave = useCallback(() => {
    documentGuards.confirmLeave();
    setGuardDialogOpen(false);
  }, [documentGuards, setGuardDialogOpen]);

  const cancelLeave = useCallback(() => {
    documentGuards.cancelLeave();
    setGuardDialogOpen(false);
  }, [documentGuards, setGuardDialogOpen]);

  return (
    <>
      <PolicyPacksPageView model={model} />
      <LivelihoodDocumentGuardDialog
        open={guardDialogOpen}
        message={documentGuards.dialogMessage}
        onConfirmLeave={confirmLeave}
        onCancelLeave={cancelLeave}
      />
    </>
  );
}
