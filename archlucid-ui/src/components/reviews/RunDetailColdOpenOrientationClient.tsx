"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { ColdSharedLinkUnpackPanel } from "@/components/operator/ColdSharedLinkUnpackPanel";
import { InviteeFirstOrientationPanel } from "@/components/operator/InviteeFirstOrientationPanel";
import { readInvitationToken } from "@/lib/auth/email-otp-session";
import {
  resolveColdSharedLinkEntrySignal,
  resolveColdSharedLinkUnpackPresentation,
} from "@/lib/cold-shared-link-unpack";
import {
  resolveInviteeFirstOrientationCopy,
  resolveInviteeOrientationContext,
} from "@/lib/invitee-first-orientation";
import type { RunDetailWorkspaceStatus } from "@/lib/run-detail-workspace-derive";
import { hasColdSharedLinkUnpackWatermark } from "@/lib/usability/last-visited-watermark";

export type RunDetailColdOpenOrientationClientProps = {
  readonly runId: string;
  readonly packageTitle: string;
  readonly packageOwnerLabel: string | null;
  readonly workspaceStatus: RunDetailWorkspaceStatus;
};

function subscribeToColdUnpackWatermark(_onStoreChange: () => void): () => void {
  return () => {};
}

function readColdUnpackDismissed(runId: string): boolean {
  return hasColdSharedLinkUnpackWatermark(runId);
}

/** Cold shared-link unpack + invitee orientation on review detail (TB-2181 / TB-2182). */
export function RunDetailColdOpenOrientationClient(
  props: RunDetailColdOpenOrientationClientProps,
): React.JSX.Element | null {
  const searchParams = useSearchParams();
  const { currentPrincipal } = useOperatorNavAuthority();
  const coldUnpackDismissed = useSyncExternalStore(
    subscribeToColdUnpackWatermark,
    () => readColdUnpackDismissed(props.runId),
    () => false,
  );

  const entrySignal = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());

    return resolveColdSharedLinkEntrySignal(params, readInvitationToken() !== null);
  }, [searchParams]);

  const inviteeContext = useMemo(
    () => resolveInviteeOrientationContext(currentPrincipal),
    [currentPrincipal],
  );

  const coldUnpackPresentation = useMemo(() => {
    if (coldUnpackDismissed) {
      return null;
    }

    return resolveColdSharedLinkUnpackPresentation({
      runId: props.runId,
      packageTitle: props.packageTitle,
      workspaceStatus: props.workspaceStatus,
      entrySignal,
      principal: currentPrincipal,
    });
  }, [
    coldUnpackDismissed,
    currentPrincipal,
    entrySignal,
    props.packageTitle,
    props.runId,
    props.workspaceStatus,
  ]);

  const inviteeCopy = useMemo(() => {
    if (!inviteeContext.isInviteeReviewer) {
      return null;
    }

    return resolveInviteeFirstOrientationCopy({
      packageOwnerLabel: props.packageOwnerLabel,
      runId: props.runId,
    });
  }, [inviteeContext.isInviteeReviewer, props.packageOwnerLabel, props.runId]);

  if (coldUnpackPresentation !== null) {
    return <ColdSharedLinkUnpackPanel runId={props.runId} presentation={coldUnpackPresentation} className="mb-4" />;
  }

  if (inviteeCopy !== null && entrySignal === "none") {
    return <InviteeFirstOrientationPanel copy={inviteeCopy} className="mb-4" />;
  }

  return null;
}
