"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DecisionRegisterTimeline } from "@/components/DecisionRegisterTimeline";
import { DecisionRegisterEmptyTeaching } from "@/components/DecisionRegisterEmptyTeaching";
import { DecisionRegisterFindingsVocabularyRail } from "@/components/DecisionRegisterFindingsVocabularyRail";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { GovernanceJobRouterStrip } from "@/components/governance/GovernanceJobRouterStrip";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  getArchitectureDecisionRegister,
  type ArchitectureDecisionRegisterEntry,
  type ArchitectureDecisionRegisterFilters,
} from "@/lib/api/governance-stickiness-api";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";
import { projectIdFromScopeHeaders } from "@/lib/operator/operator-resource-scope";
import { BUYER_GOVERNANCE_DECISION_REGISTER_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { DecisionRegisterDecisionCard } from "./DecisionRegisterDecisionCard";
import { DecisionRegisterViewEmptyShell } from "./DecisionRegisterViewEmptyShell";
import { DecisionRegisterFiltersPanel } from "./DecisionRegisterFiltersPanel";
import { DecisionRegisterSummaryRow } from "./DecisionRegisterSummaryRow";
import { DecisionRegisterViewSwitcher, type DecisionRegisterViewMode } from "./DecisionRegisterViewSwitcher";
import {
  DECISION_REGISTER_EMPTY_ACTION_GOVERNANCE,
  DECISION_REGISTER_EMPTY_ACTION_REVIEW_PACKAGES,
  DECISION_REGISTER_EMPTY_ACTION_START_REVIEW,
  DECISION_REGISTER_EMPTY_BODY,
  DECISION_REGISTER_EMPTY_TITLE,
  DECISION_REGISTER_FILTER_NO_MATCH_BODY,
  DECISION_REGISTER_FILTER_NO_MATCH_TITLE,
  DECISION_REGISTER_PAGE_SUBTITLE,
  DECISION_REGISTER_VIEW_CARDS_PANEL_LABEL,
  DECISION_REGISTER_VIEW_TIMELINE_PANEL_LABEL,
} from "./decision-register-copy";
import {
  DEFAULT_DECISION_REGISTER_DATE_PRESET,
  resolveDecisionRegisterDateRange,
  type DecisionRegisterDatePreset,
} from "./decision-register-date-range";
import { deriveDecisionRegisterSummary } from "./decision-register-summary";

const defaultDateRange = resolveDecisionRegisterDateRange(DEFAULT_DECISION_REGISTER_DATE_PRESET);

export default function DecisionRegisterClient() {
  const [workspaceDecisions, setWorkspaceDecisions] = useState<ArchitectureDecisionRegisterEntry[]>([]);
  const [filteredDecisions, setFilteredDecisions] = useState<ArchitectureDecisionRegisterEntry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [loadingFiltered, setLoadingFiltered] = useState(true);
  const [category, setCategory] = useState("");
  const [recordedAfter, setRecordedAfter] = useState(defaultDateRange.recordedAfter);
  const [recordedBefore, setRecordedBefore] = useState(defaultDateRange.recordedBefore);
  const [datePreset, setDatePreset] = useState<DecisionRegisterDatePreset>(DEFAULT_DECISION_REGISTER_DATE_PRESET);
  const [minConfidence, setMinConfidence] = useState("");
  const [maxConfidence, setMaxConfidence] = useState("");
  const [confidenceBasis, setConfidenceBasis] = useState("");
  const [viewMode, setViewMode] = useState<DecisionRegisterViewMode>("cards");

  const filters = useMemo((): ArchitectureDecisionRegisterFilters => {
    const parsed: ArchitectureDecisionRegisterFilters = {};

    if (category.trim().length > 0) {
      parsed.category = category.trim();
    }

    if (recordedAfter.trim().length > 0) {
      parsed.recordedAfterUtc = new Date(recordedAfter).toISOString();
    }

    if (recordedBefore.trim().length > 0) {
      parsed.recordedBeforeUtc = new Date(recordedBefore).toISOString();
    }

    if (minConfidence.trim().length > 0) {
      parsed.minConfidence = Number(minConfidence);
    }

    if (maxConfidence.trim().length > 0) {
      parsed.maxConfidence = Number(maxConfidence);
    }

    if (confidenceBasis.trim().length > 0) {
      parsed.buyerConfidenceSource = confidenceBasis.trim();
    }

    return parsed;
  }, [category, confidenceBasis, maxConfidence, minConfidence, recordedAfter, recordedBefore]);

  const summary = useMemo(() => deriveDecisionRegisterSummary(workspaceDecisions), [workspaceDecisions]);
  const collapseAdvancedFilters = workspaceDecisions.length === 0;
  const loading = loadingWorkspace || loadingFiltered;
  const hasWorkspaceDecisions = workspaceDecisions.length > 0;
  const hasFilteredResults = filteredDecisions.length > 0;
  const filtersExcludeMatches = hasWorkspaceDecisions && !hasFilteredResults && !loading && loadError === null;

  const resetFilters = useCallback(() => {
    const range = resolveDecisionRegisterDateRange(DEFAULT_DECISION_REGISTER_DATE_PRESET);
    setCategory("");
    setRecordedAfter(range.recordedAfter);
    setRecordedBefore(range.recordedBefore);
    setDatePreset(DEFAULT_DECISION_REGISTER_DATE_PRESET);
    setMinConfidence("");
    setMaxConfidence("");
    setConfidenceBasis("");
  }, []);

  const applyDatePreset = useCallback((preset: DecisionRegisterDatePreset) => {
    const range = resolveDecisionRegisterDateRange(preset);
    setDatePreset(preset);
    setRecordedAfter(range.recordedAfter);
    setRecordedBefore(range.recordedBefore);
  }, []);

  useEffect(() => {
    let canceled = false;

    void (async () => {
      setLoadingWorkspace(true);

      try {
        const projectId = projectIdFromScopeHeaders(getEffectiveBrowserProxyScopeHeaders());
        const response = await getArchitectureDecisionRegister(projectId);
        if (!canceled) {
          setWorkspaceDecisions(response.decisions ?? []);
        }
      } catch (error: unknown) {
        if (!canceled) {
          setWorkspaceDecisions([]);
          setLoadError(error instanceof Error ? error.message : "Failed to load decision register.");
        }
      } finally {
        if (!canceled) {
          setLoadingWorkspace(false);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    let canceled = false;

    void (async () => {
      setLoadingFiltered(true);
      setLoadError(null);

      try {
        const projectId = projectIdFromScopeHeaders(getEffectiveBrowserProxyScopeHeaders());
        const response = await getArchitectureDecisionRegister(projectId, filters);
        if (!canceled) {
          setFilteredDecisions(response.decisions ?? []);
        }
      } catch (error: unknown) {
        if (!canceled) {
          setFilteredDecisions([]);
          setLoadError(error instanceof Error ? error.message : "Failed to load decision register.");
        }
      } finally {
        if (!canceled) {
          setLoadingFiltered(false);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [filters]);

  return (
    <div className="space-y-4 p-4" data-testid="decision-register-page">
      <OperatorPageHeader
        title={BUYER_GOVERNANCE_DECISION_REGISTER_TITLE}
        subtitle={DECISION_REGISTER_PAGE_SUBTITLE}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PageContextualHelpButton />
            <DecisionRegisterViewSwitcher viewMode={viewMode} onViewModeChange={setViewMode} />
          </div>
        }
      />
      <GovernanceJobRouterStrip currentJobId="record-decisions" />
      <DecisionRegisterFindingsVocabularyRail currentSurfaceId="decision-register" />
{!loadError ? <DecisionRegisterSummaryRow summary={summary} /> : null}

      <DecisionRegisterFiltersPanel
        category={category}
        recordedAfter={recordedAfter}
        recordedBefore={recordedBefore}
        minConfidence={minConfidence}
        maxConfidence={maxConfidence}
        confidenceBasis={confidenceBasis}
        datePreset={datePreset}
        collapseAdvanced={collapseAdvancedFilters}
        onCategoryChange={setCategory}
        onRecordedAfterChange={(value) => {
          setRecordedAfter(value);
          setDatePreset("all");
        }}
        onRecordedBeforeChange={(value) => {
          setRecordedBefore(value);
          setDatePreset("all");
        }}
        onMinConfidenceChange={setMinConfidence}
        onMaxConfidenceChange={setMaxConfidence}
        onConfidenceBasisChange={setConfidenceBasis}
        onDatePresetChange={applyDatePreset}
        onClearFilters={resetFilters}
      />

      {loading ? <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading decision register…</p> : null}

      {loadError ? (
        <EnterpriseCompactEmptyState
          testId="decision-register-load-error"
          title="Decision register unavailable"
          description={loadError}
          actions={[{ label: DECISION_REGISTER_EMPTY_ACTION_REVIEW_PACKAGES, href: "/architecture/reviews", variant: "primary" }]}
        />
      ) : null}

      {!loading && !loadError && !hasWorkspaceDecisions ? (
        <DecisionRegisterViewEmptyShell viewMode={viewMode}>
          <div className="space-y-3">
            <DecisionRegisterEmptyTeaching />
            <EnterpriseCompactEmptyState
              testId="decision-register-empty-state"
              title={DECISION_REGISTER_EMPTY_TITLE}
              description={DECISION_REGISTER_EMPTY_BODY}
              actions={[
                { label: DECISION_REGISTER_EMPTY_ACTION_REVIEW_PACKAGES, href: "/architecture/reviews", variant: "primary" },
                { label: DECISION_REGISTER_EMPTY_ACTION_START_REVIEW, href: "/architecture/reviews/new", variant: "outline" },
                { label: DECISION_REGISTER_EMPTY_ACTION_GOVERNANCE, href: "/governance/approval-queue", variant: "outline" },
              ]}
            />
          </div>
        </DecisionRegisterViewEmptyShell>
      ) : null}

      {!loading && !loadError && filtersExcludeMatches ? (
        <DecisionRegisterViewEmptyShell viewMode={viewMode}>
          <EnterpriseCompactEmptyState
            testId="decision-register-filter-no-match-empty-state"
            title={DECISION_REGISTER_FILTER_NO_MATCH_TITLE}
            description={DECISION_REGISTER_FILTER_NO_MATCH_BODY}
            footer={
              <Button type="button" variant="outline" size="sm" data-testid="decision-register-clear-filters-empty" onClick={resetFilters}>
                Clear filters
              </Button>
            }
          />
        </DecisionRegisterViewEmptyShell>
      ) : null}

      {!loading && !loadError && hasFilteredResults && viewMode === "timeline" ? (
        <div aria-label={DECISION_REGISTER_VIEW_TIMELINE_PANEL_LABEL} data-testid="decision-register-timeline-panel">
          <DecisionRegisterTimeline decisions={filteredDecisions} />
        </div>
      ) : null}

      {!loading && !loadError && hasFilteredResults && viewMode === "cards" ? (
        <div
          className="grid gap-4"
          aria-label={DECISION_REGISTER_VIEW_CARDS_PANEL_LABEL}
          data-testid="decision-register-cards"
        >
          {filteredDecisions.map((decision) => (
            <DecisionRegisterDecisionCard key={`${decision.manifestId}-${decision.decisionId}`} decision={decision} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
