"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { LayerHeader } from "@/components/LayerHeader";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  formatInfraEvidenceAskApiError,
  submitInfraEvidenceAsk,
} from "@/lib/infra-evidence/infra-evidence-ask-api";
import { resolveInfraEvidenceAskCitationLink } from "@/lib/infra-evidence/infra-evidence-ask-citations";
import {
  parseResourceExplorerCloudResourceIdFromSearch,
  parseResourceHubQueryValueFromSearch,
  RESOURCE_EXPLORER_CLOUD_RESOURCE_ID_PARAM,
  RESOURCE_HUB_ASSESSMENT_ID_PARAM,
  RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM,
  RESOURCE_HUB_CONTROL_ID_PARAM,
  RESOURCE_HUB_RUN_ID_PARAM,
  RESOURCE_HUB_SNAPSHOT_ID_PARAM,
} from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import {
  INFRA_EVIDENCE_ASK_CANNED_QUESTIONS,
  type InfraEvidenceAskResponse,
} from "@/lib/infra-evidence/infra-evidence-ask-types";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function InfrastructureAskClient() {
  const searchParams = useSearchParams();
  const cloudResourceId = parseResourceExplorerCloudResourceIdFromSearch(
    searchParams.get(RESOURCE_EXPLORER_CLOUD_RESOURCE_ID_PARAM),
  );
  const runId = parseResourceHubQueryValueFromSearch(searchParams.get(RESOURCE_HUB_RUN_ID_PARAM));
  const snapshotId = parseResourceHubQueryValueFromSearch(searchParams.get(RESOURCE_HUB_SNAPSHOT_ID_PARAM));
  const assessmentId = parseResourceHubQueryValueFromSearch(searchParams.get(RESOURCE_HUB_ASSESSMENT_ID_PARAM));
  const auditEvidenceSnapshotId = parseResourceHubQueryValueFromSearch(
    searchParams.get(RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM),
  );
  const controlId = parseResourceHubQueryValueFromSearch(searchParams.get(RESOURCE_HUB_CONTROL_ID_PARAM));

  const [question, setQuestion] = useState("");
  const [useSimulator, setUseSimulator] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [response, setResponse] = useState<InfraEvidenceAskResponse | null>(null);

  const ask = useCallback(async (nextQuestion: string) => {
    const trimmed = nextQuestion.trim();

    if (trimmed.length === 0) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitInfraEvidenceAsk({
        question: trimmed,
        cloudResourceId: cloudResourceId.length > 0 ? cloudResourceId : null,
        runId: runId.length > 0 ? runId : null,
        snapshotId: snapshotId.length > 0 ? snapshotId : null,
        assessmentId: assessmentId.length > 0 ? assessmentId : null,
        auditEvidenceSnapshotId: auditEvidenceSnapshotId.length > 0 ? auditEvidenceSnapshotId : null,
        controlId: controlId.length > 0 ? controlId : null,
        useSimulator,
      });
      setResponse(result);
    } catch (error: unknown) {
      setResponse(null);
      setSubmitError(formatInfraEvidenceAskApiError(error));
    } finally {
      setSubmitting(false);
    }
  }, [
    assessmentId,
    auditEvidenceSnapshotId,
    cloudResourceId,
    controlId,
    runId,
    snapshotId,
    useSimulator,
  ]);

  useEffect(() => {
    setQuestion("");
    setResponse(null);
    setSubmitError(null);
  }, [cloudResourceId, runId, snapshotId, assessmentId, auditEvidenceSnapshotId, controlId]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      <LayerHeader pageKey="infrastructure-ask" />

      <section className="grid gap-3 rounded border border-border bg-card p-4" aria-label="Infrastructure Ask prompt">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Question</span>
          <textarea
            className="min-h-28 rounded border border-input bg-background px-3 py-2"
            data-testid="infra-ask-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask a grounded question about inventory evidence…"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {INFRA_EVIDENCE_ASK_CANNED_QUESTIONS.map((cannedQuestion) => (
            <Button
              key={cannedQuestion}
              type="button"
              variant="outline"
              size="sm"
              data-testid={`infra-ask-canned-${cannedQuestion}`}
              onClick={() => {
                setQuestion(cannedQuestion);
                void ask(cannedQuestion);
              }}
            >
              {cannedQuestion}
            </Button>
          ))}
        </div>

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            data-testid="infra-ask-use-simulator"
            checked={useSimulator}
            onChange={(event) => setUseSimulator(event.target.checked)}
          />
          <span>Use simulator (deterministic, citation-grounded template)</span>
        </label>

        <Button
          type="button"
          data-testid="infra-ask-submit"
          disabled={submitting || question.trim().length === 0}
          onClick={() => void ask(question)}
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Asking…
            </span>
          ) : (
            "Ask"
          )}
        </Button>
      </section>

      {submitError != null ? (
        <p className="m-0 text-sm text-destructive" role="alert">{submitError}</p>
      ) : null}

      {response != null ? (
        <section
          className="grid gap-3 rounded border border-border bg-card p-4"
          aria-label="Infrastructure Ask response"
          data-testid="infra-ask-response"
        >
          {response.simulatorLabel != null ? (
            <p className="m-0 rounded bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100" data-testid="infra-ask-simulator-banner">
              {response.simulatorLabel}
            </p>
          ) : null}

          {response.insufficientEvidence ? (
            <div className="grid gap-2" data-testid="infra-ask-insufficient-evidence">
              <StatusTag kind="needs-attention" label="Insufficient evidence" />
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{response.answer}</p>
            </div>
          ) : (
            <div className="grid gap-2">
              <StatusTag kind="ready" label={response.topicKind} />
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{response.answer}</p>
            </div>
          )}

          {response.citations.length > 0 ? (
            <div className="grid gap-2">
              <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Citations</h2>
              <ul className="m-0 grid gap-2 pl-5">
                {response.citations.map((citation) => {
                  const link = resolveInfraEvidenceAskCitationLink(citation);
                  const key = `${citation.kind}:${citation.id}`;

                  return (
                    <li key={key} data-testid={`infra-ask-citation-${citation.kind}-${citation.id}`}>
                      {link != null ? (
                        <Link className="text-al-link hover:underline" href={link.href}>{link.label}</Link>
                      ) : (
                        <span>{citation.label ?? `${citation.kind}: ${citation.id}`}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
