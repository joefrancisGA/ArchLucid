"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getArchitectureDecisionRegister,
  type ArchitectureDecisionRegisterEntry,
  type ArchitectureDecisionRegisterFilters,
} from "@/lib/api/governance-stickiness-api";
import {
  BUYER_GOVERNANCE_DECISION_REGISTER_LEAD,
  BUYER_GOVERNANCE_DECISION_REGISTER_TITLE,
} from "@/lib/buyer-polish-copy";

const BUYER_CONFIDENCE_OPTIONS = ["Evidence-backed", "Model-assisted", "Unknown"] as const;

export default function DecisionRegisterClient() {
  const [decisions, setDecisions] = useState<ArchitectureDecisionRegisterEntry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [recordedAfter, setRecordedAfter] = useState("");
  const [recordedBefore, setRecordedBefore] = useState("");
  const [minConfidence, setMinConfidence] = useState("");
  const [maxConfidence, setMaxConfidence] = useState("");
  const [buyerConfidenceSource, setBuyerConfidenceSource] = useState("");

  const filters = useMemo((): ArchitectureDecisionRegisterFilters => {
    const parsed: ArchitectureDecisionRegisterFilters = {};

    if (category.trim().length > 0) parsed.category = category.trim();
    if (recordedAfter.trim().length > 0) parsed.recordedAfterUtc = new Date(recordedAfter).toISOString();
    if (recordedBefore.trim().length > 0) parsed.recordedBeforeUtc = new Date(recordedBefore).toISOString();
    if (minConfidence.trim().length > 0) parsed.minConfidence = Number(minConfidence);
    if (maxConfidence.trim().length > 0) parsed.maxConfidence = Number(maxConfidence);
    if (buyerConfidenceSource.trim().length > 0) parsed.buyerConfidenceSource = buyerConfidenceSource.trim();

    return parsed;
  }, [buyerConfidenceSource, category, maxConfidence, minConfidence, recordedAfter, recordedBefore]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await getArchitectureDecisionRegister(undefined, filters);
        if (!cancelled) setDecisions(response.decisions ?? []);
      } catch (error: unknown) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Failed to load decision register.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [filters]);

  return (
    <div className="space-y-4 p-4">
      <OperatorPageHeader
        title={BUYER_GOVERNANCE_DECISION_REGISTER_TITLE}
        subtitle={BUYER_GOVERNANCE_DECISION_REGISTER_LEAD}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Category</span>
            <input
              className="rounded-md border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Recorded after</span>
            <input
              type="date"
              className="rounded-md border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
              value={recordedAfter}
              onChange={(event) => setRecordedAfter(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Recorded before</span>
            <input
              type="date"
              className="rounded-md border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
              value={recordedBefore}
              onChange={(event) => setRecordedBefore(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Min confidence</span>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              className="rounded-md border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
              value={minConfidence}
              onChange={(event) => setMinConfidence(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Max confidence</span>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              className="rounded-md border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
              value={maxConfidence}
              onChange={(event) => setMaxConfidence(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Buyer confidence source</span>
            <select
              className="rounded-md border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
              value={buyerConfidenceSource}
              onChange={(event) => setBuyerConfidenceSource(event.target.value)}
            >
              <option value="">Any</option>
              {BUYER_CONFIDENCE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setCategory("");
                setRecordedAfter("");
                setRecordedBefore("");
                setMinConfidence("");
                setMaxConfidence("");
                setBuyerConfidenceSource("");
              }}
            >
              Clear filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? <p className="text-sm text-muted-foreground">Loading decision register…</p> : null}

      {loadError ? (
        <EmptyState title="Decision register unavailable" description={loadError} />
      ) : null}

      {!loading && !loadError && decisions.length === 0 ? (
        <EmptyState
          title="No signed decisions yet"
          description="Committed manifests with architecture decisions will appear here with confidence and supporting findings."
        />
      ) : null}

      <div className="grid gap-4">
        {decisions.map((decision) => (
          <Card key={`${decision.manifestId}-${decision.decisionId}`}>
            <CardHeader>
              <CardTitle className="text-base">{decision.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Category:</span> {decision.category} ·{" "}
                <span className="font-medium">Option:</span> {decision.selectedOption}
              </p>
              <p className="text-muted-foreground">{decision.rationale}</p>
              {decision.confidence != null ? (
                <p>
                  Confidence: {decision.confidence}
                  {decision.buyerConfidenceSource
                    ? ` (${decision.buyerConfidenceSource})`
                    : decision.confidenceSource
                      ? ` (${decision.confidenceSource})`
                      : ""}
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Confidence: Unknown{decision.buyerConfidenceSource ? ` (${decision.buyerConfidenceSource})` : ""}
                </p>
              )}
              <p className="text-muted-foreground">Recorded: {decision.recordedAtUtc}</p>
              <p>
                <Link
                  className="text-blue-700 underline dark:text-blue-400"
                  href={`/manifests/${decision.manifestId}`}
                >
                  View manifest
                </Link>
                {" · "}
                <Link
                  className="text-blue-700 underline dark:text-blue-400"
                  href={`/reviews/${decision.runId}`}
                >
                  View review
                </Link>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
