"use client";

import type { JSX } from "react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import {
  commitArchitectureRun,
  createArchitectureRun,
  seedFakeArchitectureRunResults,
  type CreateArchitectureRunRequestPayload,
} from "@/lib/api";

type Step = 1 | 2 | 3 | 4;

/**
 * Core-Pilot-only first-session wizard. Advanced / Enterprise surfaces stay in the main shell;
 * this page intentionally avoids linking to them until step 4 completes.
 */
export function OnboardWizardClient(): JSX.Element {
  const [step, setStep] = useState<Step>(1);
  const [systemName, setSystemName] = useState("");
  const [brief, setBrief] = useState("");
  const [runId, setRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canAdvanceStep1 = useMemo(
    () => systemName.trim().length > 0 && brief.trim().length > 0,
    [brief, systemName],
  );

  const onSubmitRequest = useCallback(async () => {
    setError(null);
    setBusy(true);

    try {
      const requestId = crypto.randomUUID();
      const body: CreateArchitectureRunRequestPayload = {
        requestId,
        description: brief.trim(),
        systemName: systemName.trim(),
        environment: "Production",
        cloudProvider: "Azure",
        constraints: [],
        requiredCapabilities: [],
        assumptions: [],
      };

      const res = await createArchitectureRun(body);
      const id = res.run?.runId;

      if (!id) {
        setError("API did not return a run id. Check network and policy.");
        return;
      }

      setRunId(id);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }, [brief, systemName]);

  const onSeed = useCallback(async () => {
    if (runId === null) return;

    setError(null);
    setBusy(true);

    try {
      await seedFakeArchitectureRunResults(runId);
      setStep(3);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Seed failed (expected in Production — use real agent completion or a non-Production API).",
      );
    } finally {
      setBusy(false);
    }
  }, [runId]);

  const onSkipSeed = useCallback(() => {
    if (runId === null) return;

    setError(null);
    setStep(3);
  }, [runId]);

  const onCommit = useCallback(async () => {
    if (runId === null) return;

    setError(null);
    setBusy(true);

    try {
      await commitArchitectureRun(runId);
      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Commit failed.");
    } finally {
      setBusy(false);
    }
  }, [runId]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Core Pilot — first session</h1>
      <p className="mb-6 text-sm text-slate-600">
        Four linear steps. Stay here until you finish step 4; Advanced Analysis and Enterprise Controls remain available
        from the main shell afterward — they are not required for first-pilot success.
      </p>

      {error ? <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}

      <ol className="mb-6 list-decimal space-y-6 pl-5 text-sm">
        <li className={step === 1 ? "font-semibold text-slate-900" : "text-slate-600"}>
          <div className="font-medium">Name the system and paste a short brief</div>
          {step === 1 ? (
            <div className="mt-3 space-y-3">
              <label className="block text-xs font-medium text-slate-700" htmlFor="onboard-system">
                System name
                <input
                  id="onboard-system"
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <label className="block text-xs font-medium text-slate-700" htmlFor="onboard-brief">
                Brief
                <textarea
                  id="onboard-brief"
                  className="mt-1 min-h-[96px] w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                disabled={!canAdvanceStep1 || busy}
                onClick={() => void onSubmitRequest()}
              >
                Submit request
              </button>
            </div>
          ) : null}
        </li>

        <li className={step === 2 ? "font-semibold text-slate-900" : "text-slate-600"}>
          <div className="font-medium">Prepare agent results</div>
          {step === 2 ? (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-slate-600">
                Run id <code className="rounded bg-slate-100 px-1">{runId}</code>. In non-Production APIs use seed fake
                results; in Production complete agents via your normal pipeline, then continue.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                  disabled={busy}
                  onClick={() => void onSeed()}
                >
                  Seed fake results (non-Production)
                </button>
                <button
                  type="button"
                  className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-800 disabled:opacity-50"
                  disabled={busy}
                  onClick={onSkipSeed}
                >
                  Agent results ready — continue
                </button>
              </div>
            </div>
          ) : null}
        </li>

        <li className={step === 3 ? "font-semibold text-slate-900" : "text-slate-600"}>
          <div className="font-medium">Commit golden manifest</div>
          {step === 3 ? (
            <div className="mt-3">
              <button
                type="button"
                className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                disabled={busy}
                onClick={() => void onCommit()}
              >
                Commit run
              </button>
            </div>
          ) : null}
        </li>

        <li className={step === 4 ? "font-semibold text-slate-900" : "text-slate-600"}>
          <div className="font-medium">Review hand-off</div>
          {step === 4 ? (
            <div className="mt-3 space-y-3 text-sm text-slate-700">
              <p>
                First commit recorded for this tenant. Open the run to review manifest and artifacts:{" "}
                <Link className="text-blue-700 underline" href={`/runs/${encodeURIComponent(runId ?? "")}`}>
                  /runs/{runId}
                </Link>
                .
              </p>
              <p className="text-xs text-slate-600">
                Optional next layers (Advanced Analysis, Enterprise Controls) are not required for first-pilot success —
                see <code className="text-[0.85em]">docs/EXECUTIVE_SPONSOR_BRIEF.md</code> §8.
              </p>
            </div>
          ) : null}
        </li>
      </ol>

      <p className="text-xs text-slate-500">
        This route calls the same authenticated architecture endpoints as the rest of the operator shell; it does not
        bypass RBAC.
      </p>
    </main>
  );
}
