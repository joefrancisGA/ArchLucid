"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getArchitectureDecisionRegister, type ArchitectureDecisionRegisterEntry } from "@/lib/api/governance-stickiness-api";
import {
  BUYER_GOVERNANCE_DECISION_REGISTER_LEAD,
  BUYER_GOVERNANCE_DECISION_REGISTER_TITLE,
} from "@/lib/buyer-polish-copy";

export default function DecisionRegisterClient() {
  const [decisions, setDecisions] = useState<ArchitectureDecisionRegisterEntry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await getArchitectureDecisionRegister();
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
  }, []);

  return (
    <div className="space-y-6 p-6">
      <OperatorPageHeader
        title={BUYER_GOVERNANCE_DECISION_REGISTER_TITLE}
        subtitle={BUYER_GOVERNANCE_DECISION_REGISTER_LEAD}
      />

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
                  {decision.confidenceSource ? ` (${decision.confidenceSource})` : ""}
                </p>
              ) : (
                <p className="text-muted-foreground">Confidence: not computed</p>
              )}
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
