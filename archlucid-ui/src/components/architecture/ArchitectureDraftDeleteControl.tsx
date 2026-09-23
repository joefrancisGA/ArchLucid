"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { showMutationError } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { abandonDraftRequest } from "@/lib/api/draft-intake-api";
import { architectureDraftIntakeMutationBlockedReason } from "@/lib/architecture/architecture-draft-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isApiRequestError } from "@/lib/api-request-error";
import {
  ARCHITECTURE_DRAFT_DELETE_CONFIRM_ACTION_LABEL,
  ARCHITECTURE_DRAFT_DELETE_CONFIRM_CANCEL_LABEL,
  ARCHITECTURE_DRAFT_DELETE_CONFIRM_TITLE,
  ARCHITECTURE_DRAFT_DELETE_FAILURE_MESSAGE,
  ARCHITECTURE_DRAFT_DELETE_SUCCESS_TOAST,
  architectureDraftDeleteConfirmDescription,
} from "@/lib/architecture/architecture-draft-delete-copy";
import { useWorkOwnershipDeletePolicyQuery } from "@/hooks/use-work-ownership-delete-policy-query";
import { canDeleteArchitectureDraft } from "@/lib/architecture/architecture-draft-delete-eligibility";
import type { ArchitectureDraftCustomerStatus } from "@/lib/architecture/architecture-draft-status";
import {
  invalidateArchitectureDraftListQueries,
  removeArchitectureDraftFromListCache,
} from "@/lib/architecture/architecture-draft-list-client";
import { removeArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import {
  parseArchitectureDraftDeleteConfirmOpenFromSearch,
  parseArchitectureDraftDeleteIdFromSearch,
  architectureDraftDeleteConfirmHrefFromSearch,
} from "@/lib/architecture/architecture-draft-delete-confirm-url";

export type ArchitectureDraftDeleteControlProps = {
  readonly draftId: string;
  readonly displayName: string;
  readonly linkedReviewId: string | null;
  readonly customerStatus?: ArchitectureDraftCustomerStatus;
  readonly serverStatus?: string | null;
  readonly createdByUserId?: string | null;
  readonly buttonLabel?: string;
  readonly testId?: string;
  readonly onDeleted?: () => void;
};

/** Confirms and abandons a pre-review architecture draft (irreversible). */
export function ArchitectureDraftDeleteControl(props: ArchitectureDraftDeleteControlProps): React.JSX.Element | null {
  const router = useRouter();
  const pathname = usePathname() ?? ARCHITECTURES_LIST_PATH;
  const { callerAuthorityRank, currentPrincipal, isAuthorityLoading } = useOperatorNavAuthority();
  const policyQuery = useWorkOwnershipDeletePolicyQuery();
  const canExecute = !isAuthorityLoading && callerAuthorityRank >= AUTHORITY_RANK.ExecuteAuthority;
  const readConfirmOpenFromUrl = (): boolean => {
    const search = typeof window === "undefined" ? "" : window.location.search;
    const params = new URLSearchParams(search);
    const urlDraftDeleteId = parseArchitectureDraftDeleteIdFromSearch(params.get("draftDeleteId"));
    const urlDraftDeleteConfirm = parseArchitectureDraftDeleteConfirmOpenFromSearch(
      params.get("draftDeleteConfirm"),
    );

    return urlDraftDeleteConfirm && urlDraftDeleteId === props.draftId;
  };
  const [confirmOpen, setConfirmOpenState] = useState(() => readConfirmOpenFromUrl());
  const confirmOpenRef = useRef(confirmOpen);
  confirmOpenRef.current = confirmOpen;
  const [busy, setBusy] = useState(false);

  const syncDeleteConfirmToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        architectureDraftDeleteConfirmHrefFromSearch(
          readWindowLocationSearch(),
          {
            draftId: open ? props.draftId : null,
            confirmOpen: open,
          },
          pathname,
        ),
        { notify: false },
      );
    },
    [pathname, props.draftId],
  );

  const setConfirmOpen = useCallback(
    (open: boolean) => {
      if (confirmOpenRef.current === open) {
        return;
      }

      confirmOpenRef.current = open;
      setConfirmOpenState(open);
      syncDeleteConfirmToUrl(open);
    },
    [syncDeleteConfirmToUrl],
  );

  useEffect(() => {
    const syncConfirmOpenFromUrl = (): void => {
      const next = readConfirmOpenFromUrl();

      if (confirmOpenRef.current === next) {
        return;
      }

      confirmOpenRef.current = next;
      setConfirmOpenState(next);
    };

    syncConfirmOpenFromUrl();
    window.addEventListener("popstate", syncConfirmOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncConfirmOpenFromUrl);
    };
  }, [props.draftId]);

  const eligible = canDeleteArchitectureDraft({
    linkedReviewId: props.linkedReviewId,
    customerStatus: props.customerStatus,
    serverStatus: props.serverStatus,
    createdByUserId: props.createdByUserId,
    callerAuthorityRank,
    allowCreatorDeleteOwnedWork: policyQuery.data?.allowCreatorDeleteOwnedWork ?? true,
    callerPrincipal: currentPrincipal,
  });

  const finishDelete = useCallback(() => {
    removeArchitectureDraftRegistryEntry(props.draftId);
    removeArchitectureDraftFromListCache(props.draftId);
    void invalidateArchitectureDraftListQueries();
    toast.success(ARCHITECTURE_DRAFT_DELETE_SUCCESS_TOAST);
    props.onDeleted?.();
    setConfirmOpen(false);

    if (pathname !== ARCHITECTURES_LIST_PATH) {
      router.push(ARCHITECTURES_LIST_PATH);
    }

    router.refresh();
  }, [pathname, props, router, setConfirmOpen]);

  const handleConfirm = useCallback(async () => {
    setBusy(true);

    try {
      await abandonDraftRequest(props.draftId);
      finishDelete();
    } catch (error) {
      if (isApiRequestError(error) && error.httpStatus === 404) {
        finishDelete();

        return;
      }

      showMutationError(
        ARCHITECTURE_DRAFT_DELETE_FAILURE_MESSAGE,
        undefined,
        isApiRequestError(error)
          ? {
              description:
                architectureDraftIntakeMutationBlockedReason(toApiLoadFailure(error)) ?? error.message,
            }
          : undefined,
      );
    } finally {
      setBusy(false);
    }
  }, [finishDelete, props.draftId]);

  if (!eligible || !canExecute) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid={props.testId ?? `architecture-draft-delete-${props.draftId}`}
        onClick={() => setConfirmOpen(true)}
      >
        {props.buttonLabel ?? "Delete architecture draft"}
      </Button>
      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!busy) {
            setConfirmOpen(open);
          }
        }}
        title={ARCHITECTURE_DRAFT_DELETE_CONFIRM_TITLE}
        description={architectureDraftDeleteConfirmDescription(props.displayName)}
        confirmLabel={ARCHITECTURE_DRAFT_DELETE_CONFIRM_ACTION_LABEL}
        cancelLabel={ARCHITECTURE_DRAFT_DELETE_CONFIRM_CANCEL_LABEL}
        variant="destructive"
        busy={busy}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
}
