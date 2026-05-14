"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { useSearchParams } from "next/navigation";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { MutationErrorBoundary } from "@/components/MutationErrorBoundary";
import { EmptyState } from "@/components/EmptyState";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { GovernanceInteractiveQuickstartCard } from "@/components/GovernanceInteractiveQuickstartCard";
import { GovernanceApprovalStoryCard } from "@/components/GovernanceApprovalStoryCard";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LayerHeader } from "@/components/LayerHeader";
import {
  activateEnvironment,
  approveRequest,
  listActivations,
  listApprovalRequests,
  listPromotions,
  promoteManifest,
  rejectRequest,
  submitApprovalRequest,
} from "@/lib/api";
import { GOVERNANCE_WORKFLOW_IDLE, GOVERNANCE_WORKFLOW_IDLE_READER } from "@/lib/empty-state-presets";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  governanceWorkflowPageLeadOperator,
  governanceWorkflowPageLeadReader,
  governanceWorkflowOutcomeBannerLine,
} from "@/lib/enterprise-controls-context-copy";
import { useEnterpriseMutationCapability } from "@/hooks/use-enterprise-mutation-capability";
import { cn } from "@/lib/utils";
import { isBuyerPolishedOperatorShellEnv, isBuyerSafeDemoMarketingChromeEnv } from "@/lib/demo-ui-env";
import {
  isStaticDemoPayloadFallbackEnabled,
  tryStaticDemoGovernanceApprovalRequests,
  tryStaticDemoGovernancePromotions,
} from "@/lib/operator-static-demo";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type {
  GovernanceApprovalRequest,
  GovernanceEnvironmentActivation,
  GovernancePromotionRecord,
} from "@/types/governance-workflow";
import { GovernanceWorkflowApprovalsList } from "./GovernanceWorkflowApprovalsList";
import { GovernanceWorkflowDialogs } from "./GovernanceWorkflowDialogs";
import { GovernanceWorkflowPromotionsActivationsSection } from "./GovernanceWorkflowPromotionsActivationsSection";
import { GovernanceWorkflowQueryCard } from "./GovernanceWorkflowQueryCard";
import { GovernanceWorkflowSubmitSection } from "./GovernanceWorkflowSubmitSection";
import {
  sortGovernanceActivations,
  sortGovernancePromotions,
  type GovernanceWorkflowPendingReview,
  type GovernanceWorkflowToastState,
} from "./governance-workflow-helpers";

export function GovernanceWorkflowPageContent() {
  const searchParams = useSearchParams();
  const canMutateWorkflow = useEnterpriseMutationCapability();
  const [toast, setToast] = useState<GovernanceWorkflowToastState>(null);
  const isStaticDemoFallbackActiveForShowcase =
    isStaticDemoPayloadFallbackEnabled() ||
    tryStaticDemoGovernanceApprovalRequests(SHOWCASE_STATIC_DEMO_RUN_ID) !== null;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  // Pre-seed demo state synchronously so the first render already shows the approval
  // outcome card rather than the empty / instruction-first state that appears before
  // the useEffect hydration cycle completes.
  const isDemoShell = isStaticDemoFallbackActiveForShowcase || buyerPolishedShell;
  const initialDemoApprovals = isDemoShell
    ? (tryStaticDemoGovernanceApprovalRequests(SHOWCASE_STATIC_DEMO_RUN_ID) ?? [])
    : [];
  const initialDemoPromotions = isDemoShell
    ? (tryStaticDemoGovernancePromotions(SHOWCASE_STATIC_DEMO_RUN_ID) ?? [])
    : [];
  const initialDemoActiveRunId: string | null = isDemoShell ? SHOWCASE_STATIC_DEMO_RUN_ID : null;

  const [submitRunId, setSubmitRunId] = useState(isDemoShell ? SHOWCASE_STATIC_DEMO_RUN_ID : "");
  const [submitManifestVersion, setSubmitManifestVersion] = useState(isDemoShell ? "3.4.1" : "");
  const [submitSource, setSubmitSource] = useState<string>("dev");
  const [submitTarget, setSubmitTarget] = useState<string>("test");
  const [submitComment, setSubmitComment] = useState("");
  const [submitBusy, setSubmitBusy] = useState(false);

  const [queryRunId, setQueryRunId] = useState(isDemoShell ? SHOWCASE_STATIC_DEMO_RUN_ID : "");
  const [activeRunId, setActiveRunId] = useState<string | null>(initialDemoActiveRunId);
  const [workflowActor, setWorkflowActor] = useState("");

  const [approvals, setApprovals] = useState<GovernanceApprovalRequest[]>(initialDemoApprovals);
  const [promotions, setPromotions] = useState<GovernancePromotionRecord[]>(
    sortGovernancePromotions(initialDemoPromotions),
  );
  const [activations, setActivations] = useState<GovernanceEnvironmentActivation[]>([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [listFailure, setListFailure] = useState<ApiLoadFailureState | null>(null);
  const hideGovernanceQueryLoadCard = buyerPolishedShell && approvals.length > 0;

  const buyerSuppressGovernanceSubmitChrome =
    buyerPolishedShell && activeRunId !== null && approvals.length > 0;

  const listsLoadingShowsBusyChrome = listsLoading && !(buyerPolishedShell && approvals.length > 0);

  const [pendingReview, setPendingReview] = useState<GovernanceWorkflowPendingReview | null>(null);
  const [reviewedBy, setReviewedBy] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);

  const [promoteBusy, setPromoteBusy] = useState(false);

  const [pendingPromote, setPendingPromote] = useState<{
    manifestId: string;
    targetEnv: string;
  } | null>(null);
  const pendingPromoteRequestRef = useRef<GovernanceApprovalRequest | null>(null);

  const [pendingActivate, setPendingActivate] = useState<{
    activationId: string;
    env: string;
  } | null>(null);
  const pendingActivatePromotionRef = useRef<GovernancePromotionRecord | null>(null);

  const [activateBusyId, setActivateBusyId] = useState<string | null>(null);

  const demoPrefillRanRef = useRef(false);

  useEffect(() => {
    if (toast === null) {
      return;
    }

    const handle = window.setTimeout(() => setToast(null), 5000);

    return () => window.clearTimeout(handle);
  }, [toast]);

  useEffect(() => {
    if (canMutateWorkflow) {
      return;
    }

    setPendingReview(null);
    setPendingPromote(null);
    pendingPromoteRequestRef.current = null;
    setPendingActivate(null);
    pendingActivatePromotionRef.current = null;
  }, [canMutateWorkflow]);

  useEffect(() => {
    const fromQuery = searchParams.get("runId");

    if (fromQuery?.trim()) {
      setQueryRunId(fromQuery.trim());
    }
  }, [searchParams]);

  const loadLists = useCallback(async (runId: string) => {
    setListsLoading(true);
    setListFailure(null);

    const optimisticApprovals = tryStaticDemoGovernanceApprovalRequests(runId);
    const optimisticPromotions = tryStaticDemoGovernancePromotions(runId);

    if (optimisticApprovals !== null) {
      setApprovals(optimisticApprovals);
    } else {
      setApprovals([]);
    }

    if (optimisticPromotions !== null) {
      setPromotions(sortGovernancePromotions(optimisticPromotions));
    } else {
      setPromotions([]);
    }

    setActivations([]);

    try {
      const [a, p, act] = await Promise.all([
        listApprovalRequests(runId),
        listPromotions(runId),
        listActivations(runId),
      ]);
      let nextApprovals = a;
      let nextPromotions = p;

      if (nextApprovals.length === 0) {
        const seeded = tryStaticDemoGovernanceApprovalRequests(runId);

        if (seeded !== null) {
          nextApprovals = seeded;
        }
      }

      if (nextPromotions.length === 0) {
        const seededP = tryStaticDemoGovernancePromotions(runId);

        if (seededP !== null) {
          nextPromotions = seededP;
        }
      }

      setApprovals(nextApprovals);
      setPromotions(sortGovernancePromotions(nextPromotions));
      setActivations(sortGovernanceActivations(act));
    } catch (e) {
      const fail = toApiLoadFailure(e);
      setApprovals([]);
      setPromotions([]);
      setActivations([]);

      const idForDemo = runId.trim();

      if (idForDemo.length > 0) {
        const seeded = tryStaticDemoGovernanceApprovalRequests(idForDemo);
        const seededP = tryStaticDemoGovernancePromotions(idForDemo);

        if (seeded !== null) {
          setApprovals(seeded);
        }

        if (seededP !== null) {
          setPromotions(sortGovernancePromotions(seededP));
        }

        if (seeded !== null || seededP !== null) {
          setListFailure(null);
          setListsLoading(false);

          return;
        }
      }

      setListFailure(fail);
    } finally {
      setListsLoading(false);
    }
  }, []);

  const onLoadRun = useCallback(() => {
    const id = queryRunId.trim();

    if (!id) {
      setToast({ kind: "err", message: "Choose a review to load approval data." });

      return;
    }

    setActiveRunId(id);
    setSubmitRunId((prev) => (prev.trim().length === 0 ? id : prev));
    void loadLists(id);
  }, [queryRunId, loadLists]);

  const refreshIfActive = useCallback(async () => {
    if (activeRunId !== null) {
      await loadLists(activeRunId);
    }
  }, [activeRunId, loadLists]);

  useEffect(() => {
    if (!isStaticDemoPayloadFallbackEnabled() && !isStaticDemoFallbackActiveForShowcase) {
      return;
    }

    if (demoPrefillRanRef.current) {
      return;
    }

    const fromSearch = searchParams.get("runId")?.trim() ?? "";

    if (fromSearch.length > 0) {
      demoPrefillRanRef.current = true;

      return;
    }

    if (queryRunId.trim().length > 0) {
      demoPrefillRanRef.current = true;
      // State was pre-seeded synchronously; still try the API to replace demo data with live data.
      void loadLists(queryRunId.trim());

      return;
    }

    demoPrefillRanRef.current = true;
    setQueryRunId(SHOWCASE_STATIC_DEMO_RUN_ID);
    setActiveRunId(SHOWCASE_STATIC_DEMO_RUN_ID);
    setSubmitRunId(SHOWCASE_STATIC_DEMO_RUN_ID);
    setSubmitManifestVersion("3.4.1");
    void loadLists(SHOWCASE_STATIC_DEMO_RUN_ID);
  }, [searchParams, queryRunId, loadLists, isStaticDemoFallbackActiveForShowcase]);

  async function onSubmitApproval() {
    if (!canMutateWorkflow) {
      return;
    }

    const runId = submitRunId.trim();

    if (!runId || !submitManifestVersion.trim()) {
      setToast({ kind: "err", message: "Choose a review and enter a manifest version." });

      return;
    }

    setSubmitBusy(true);

    try {
      await submitApprovalRequest({
        runId,
        manifestVersion: submitManifestVersion.trim(),
        sourceEnvironment: submitSource,
        targetEnvironment: submitTarget,
        requestComment: submitComment.trim() || undefined,
      });
      setToast({ kind: "ok", message: "Approval request submitted." });
      setSubmitComment("");

      if (activeRunId === runId) {
        await loadLists(runId);
      }
    } catch (e) {
      const f = toApiLoadFailure(e);
      setToast({ kind: "err", message: f.message });
    } finally {
      setSubmitBusy(false);
    }
  }

  async function onConfirmReview() {
    if (pendingReview === null) {
      return;
    }

    if (!canMutateWorkflow) {
      return;
    }

    if (!reviewedBy.trim()) {
      setToast({ kind: "err", message: "Reviewed by is required." });

      return;
    }

    setReviewBusy(true);

    try {
      if (pendingReview.mode === "approve") {
        await approveRequest(pendingReview.approvalRequestId, {
          reviewedBy: reviewedBy.trim(),
          reviewComment: reviewComment.trim() || undefined,
        });
        setToast({ kind: "ok", message: "Request approved." });
      } else {
        await rejectRequest(pendingReview.approvalRequestId, {
          reviewedBy: reviewedBy.trim(),
          reviewComment: reviewComment.trim() || undefined,
        });
        setToast({ kind: "ok", message: "Request rejected." });
      }

      setPendingReview(null);
      setReviewedBy("");
      setReviewComment("");
      await refreshIfActive();
    } catch (e) {
      const f = toApiLoadFailure(e);
      setToast({ kind: "err", message: f.message });
    } finally {
      setReviewBusy(false);
    }
  }

  async function onConfirmPromote() {
    const promoteFor = pendingPromoteRequestRef.current;

    if (promoteFor === null) {
      return;
    }

    if (!canMutateWorkflow) {
      return;
    }

    const by = workflowActor.trim();

    if (!by) {
      setToast({ kind: "err", message: "Enter your name for the audit trail before promoting." });

      return;
    }

    setPromoteBusy(true);

    try {
      await promoteManifest({
        runId: promoteFor.runId,
        manifestVersion: promoteFor.manifestVersion,
        sourceEnvironment: promoteFor.sourceEnvironment,
        targetEnvironment: promoteFor.targetEnvironment,
        promotedBy: by,
        approvalRequestId: promoteFor.approvalRequestId ?? undefined,
      });
      setToast({ kind: "ok", message: "Manifest promoted." });
      setPendingPromote(null);
      pendingPromoteRequestRef.current = null;
      await refreshIfActive();
    } catch (e) {
      const f = toApiLoadFailure(e);
      setToast({ kind: "err", message: f.message });
    } finally {
      setPromoteBusy(false);
    }
  }

  async function onConfirmActivateFromPromotion() {
    const row = pendingActivatePromotionRef.current;

    if (row === null) {
      return;
    }

    if (!canMutateWorkflow) {
      return;
    }

    const by = workflowActor.trim();

    if (!by) {
      setToast({ kind: "err", message: "Enter your name for the audit trail before activating." });

      return;
    }

    setActivateBusyId(row.promotionRecordId);

    try {
      await activateEnvironment({
        runId: row.runId,
        manifestVersion: row.manifestVersion,
        environment: row.targetEnvironment,
        activatedBy: by,
      });
      setToast({ kind: "ok", message: `Activated ${row.manifestVersion} for ${row.targetEnvironment}.` });
      setPendingActivate(null);
      pendingActivatePromotionRef.current = null;
      await refreshIfActive();
    } catch (e) {
      const f = toApiLoadFailure(e);
      setToast({ kind: "err", message: f.message });
    } finally {
      setActivateBusyId(null);
    }
  }

  return (
    <MutationErrorBoundary title="Governance workflow failed to render">
    <TooltipProvider delayDuration={300}>
    <div className="mx-auto max-w-4xl">
      <LayerHeader pageKey="governance-workflow" />
      <OperatorPageHeader
        title={buyerPolishedShell ? "Governance approval" : "Governance workflow"}
        docsPageKey="/governance"
        subtitle={
          buyerPolishedShell && approvals.length > 0 && activeRunId !== null
            ? "This approval records architecture governance disposition for this sealed review package — production deployments remain governed by your enterprise change-management process."
            : buyerPolishedShell
              ? "The approval path records whether a finalized review package is authorized for governed use. ArchLucid stores approvals and audit context; your enterprise change process governs any environment movement."
              : canMutateWorkflow
                ? governanceWorkflowPageLeadOperator
                : governanceWorkflowPageLeadReader
        }
        helpKey="governance-workflow"
      />
      {buyerPolishedShell && !(approvals.length > 0 && activeRunId !== null) ? (
        <p
          className="mb-4 max-w-prose rounded-md border border-teal-200/80 bg-teal-50/60 px-3 py-2 text-sm text-neutral-800 dark:border-teal-900/60 dark:bg-teal-950/30 dark:text-neutral-200"
          data-testid="governance-buyer-why-matters"
        >
          This confirms the review package has passed the required approval sequence before being used for architecture
          decision support, review-board readouts, and audit inquiries.
        </p>
      ) : null}
      {buyerPolishedShell && approvals.length > 0 && activeRunId !== null ? (
        <div
          className="mb-4 max-w-prose rounded-md border border-emerald-200/80 bg-emerald-50/50 px-3 py-3 text-sm leading-relaxed text-neutral-900 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-50"
          data-testid="governance-buyer-decision-summary"
        >
          <p className="m-0 font-semibold text-neutral-900 dark:text-neutral-50">Executive decision recap</p>
          <p className="m-0 mt-2 text-neutral-800 dark:text-neutral-100">
            Approved for governed use with a monitored PHI minimization control. Reviewer:&nbsp;
            <span className="font-medium">{approvals[0]!.reviewedBy ?? "Jordan Lee"}</span>
            {" · "}Review owner:&nbsp;
            <span className="font-medium">{approvals[0]!.requestedBy ?? "Taylor Morgan"}</span>
            .
          </p>
          <p className="m-0 mt-2 text-neutral-700 dark:text-neutral-200">
            Remaining cadence: weekly exception-volume sampling while this monitored posture stays open.
          </p>
        </div>
      ) : null}
      {buyerPolishedShell && approvals.length > 0 && activeRunId !== null ? (
        <GovernanceApprovalStoryCard row={approvals[0]!} />
      ) : null}
      {buyerPolishedShell && approvals.length > 0 && activeRunId !== null ? (
        <div className="mb-6">
          <Button type="button" asChild variant="primary" size="lg" className="mt-2">
            <Link href={`/audit?runId=${encodeURIComponent(activeRunId)}`}>Open audit trail</Link>
          </Button>
        </div>
      ) : null}
      {!(buyerPolishedShell && approvals.length > 0 && activeRunId !== null) ? (
      <p
        className="mb-4 max-w-prose rounded-md border border-neutral-200 bg-neutral-50/90 px-3 py-2 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-200"
        data-testid="governance-workflow-outcome-banner"
      >
        {governanceWorkflowOutcomeBannerLine}
      </p>
      ) : null}

      {buyerPolishedShell ? (
        <CollapsibleSection title="Governance quick path" defaultOpen={false}>
          <GovernanceInteractiveQuickstartCard hideFirst30DaysLink suppressCardTitle className="mb-0" />
        </CollapsibleSection>
      ) : (
        <GovernanceInteractiveQuickstartCard />
      )}

      {(isBuyerSafeDemoMarketingChromeEnv() || isStaticDemoPayloadFallbackEnabled()) ? (
        <div className="mb-6 rounded-md border border-violet-200 bg-violet-50/70 px-4 py-3 text-sm text-neutral-900 dark:border-violet-900 dark:bg-violet-950/40 dark:text-neutral-50">
          <strong>Sample approval path</strong>
          {" — "}
          Read-only sample timeline. In production, authorized roles submit requests, complete approval, release approved
          packages to each environment, and record go-live.
        </div>
      ) : null}

      {toast ? (
        <div
          role="status"
          className={cn(
            "fixed bottom-6 right-6 z-50 max-w-sm rounded-lg px-4 py-3 text-sm shadow-lg",
            toast.kind === "ok"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-100"
              : "border border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/80 dark:text-red-100",
          )}
        >
          {toast.message}
        </div>
      ) : null}

      {listFailure !== null ? (
        <div className="mb-6" role="alert">
          <OperatorApiProblem
            problem={listFailure.problem}
            fallbackMessage={listFailure.message}
            correlationId={listFailure.correlationId}
          />
        </div>
      ) : null}

      {activeRunId === null && !listsLoading && listFailure === null ? (
        <div className="mb-6">
          <EmptyState {...(canMutateWorkflow ? GOVERNANCE_WORKFLOW_IDLE : GOVERNANCE_WORKFLOW_IDLE_READER)} />
        </div>
      ) : null}

      <div
        className={cn(
          "flex flex-col",
          buyerPolishedShell || !canMutateWorkflow ? "flex-col-reverse" : "flex-col",
        )}
      >
      <GovernanceWorkflowSubmitSection
        buyerPolishedShell={buyerPolishedShell}
        buyerSuppressGovernanceSubmitChrome={buyerSuppressGovernanceSubmitChrome}
        canMutateWorkflow={canMutateWorkflow}
        hideGovernanceQueryLoadCard={hideGovernanceQueryLoadCard}
        submitRunId={submitRunId}
        setSubmitRunId={setSubmitRunId}
        submitManifestVersion={submitManifestVersion}
        setSubmitManifestVersion={setSubmitManifestVersion}
        submitSource={submitSource}
        setSubmitSource={setSubmitSource}
        submitTarget={submitTarget}
        setSubmitTarget={setSubmitTarget}
        submitComment={submitComment}
        setSubmitComment={setSubmitComment}
        submitBusy={submitBusy}
        onSubmitApproval={onSubmitApproval}
      />

      <Separator className="mb-10" />

      <section className="mb-10">
        <GovernanceWorkflowQueryCard
          hideGovernanceQueryLoadCard={hideGovernanceQueryLoadCard}
          activeRunId={activeRunId}
          buyerPolishedShell={buyerPolishedShell}
          canMutateWorkflow={canMutateWorkflow}
          queryRunId={queryRunId}
          setQueryRunId={setQueryRunId}
          setActiveRunId={setActiveRunId}
          loadLists={loadLists}
          onLoadRun={onLoadRun}
          listsLoading={listsLoading}
          listsLoadingShowsBusyChrome={listsLoadingShowsBusyChrome}
          refreshIfActive={refreshIfActive}
          workflowActor={workflowActor}
          setWorkflowActor={setWorkflowActor}
        />
        <GovernanceWorkflowApprovalsList
          buyerPolishedShell={buyerPolishedShell}
          canMutateWorkflow={canMutateWorkflow}
          listsLoading={listsLoading}
          activeRunId={activeRunId}
          approvals={approvals}
          listFailure={listFailure}
          pendingReview={pendingReview}
          setPendingReview={setPendingReview}
          reviewedBy={reviewedBy}
          setReviewedBy={setReviewedBy}
          reviewComment={reviewComment}
          setReviewComment={setReviewComment}
          reviewBusy={reviewBusy}
          onConfirmReview={onConfirmReview}
          workflowActor={workflowActor}
          refreshIfActive={refreshIfActive}
          pendingPromote={pendingPromote}
          setPendingPromote={setPendingPromote}
          pendingPromoteRequestRef={pendingPromoteRequestRef}
        />
      </section>
      </div>

      {buyerPolishedShell ? null : (
        <>
          <Separator className="mb-10" />

          <AdvancedOptionsAccordion className="mb-10">
            <GovernanceWorkflowPromotionsActivationsSection
              canMutateWorkflow={canMutateWorkflow}
              listsLoading={listsLoading}
              activeRunId={activeRunId}
              promotions={promotions}
              activations={activations}
              listFailure={listFailure}
              workflowActor={workflowActor}
              pendingActivate={pendingActivate}
              setPendingActivate={setPendingActivate}
              pendingActivatePromotionRef={pendingActivatePromotionRef}
              activateBusyId={activateBusyId}
            />
          </AdvancedOptionsAccordion>
        </>
      )}

      <GovernanceWorkflowDialogs
        pendingPromote={pendingPromote}
        setPendingPromote={setPendingPromote}
        pendingPromoteRequestRef={pendingPromoteRequestRef}
        promoteBusy={promoteBusy}
        onConfirmPromote={onConfirmPromote}
        pendingActivate={pendingActivate}
        setPendingActivate={setPendingActivate}
        pendingActivatePromotionRef={pendingActivatePromotionRef}
        activateBusyId={activateBusyId}
        onConfirmActivateFromPromotion={onConfirmActivateFromPromotion}
      />
    </div>
    </TooltipProvider>
    </MutationErrorBoundary>
  );
}
